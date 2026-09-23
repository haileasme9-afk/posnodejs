import { NextResponse } from 'next/server';
import { sql, transaction } from '@/lib/neon';
import { requirePermission } from '@/lib/auth';
import { num, getNextInvoiceNumber, getNextFsNumber, generateOrderNumber, getSettings } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { error } = await requirePermission('orders');
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const q = searchParams.get('q');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 25;

    try {
        if (id) {
            const orders = await sql`SELECT * FROM orders WHERE id = ${id}`;
            if (orders.length === 0) {
                return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
            }
            const items = await sql`SELECT * FROM order_items WHERE order_id = ${id}`;
            return NextResponse.json({ success: true, data: { ...orders[0], items } });
        }

        let query = `SELECT o.*, u.full_name as user_name, s.name as store_name
                     FROM orders o
                     LEFT JOIN users u ON o.user_id = u.id
                     LEFT JOIN stores s ON o.store_id = s.id
                     WHERE TRUE`;
        const params: unknown[] = [];

        if (status) {
            params.push(status);
            query += ` AND o.status = $${params.length}`;
        }
        if (q) {
            params.push(`%${q}%`);
            query += ` AND (o.order_number ILIKE $${params.length} OR o.invoice_number ILIKE $${params.length} OR o.customer_name ILIKE $${params.length})`;
        }
        params.push(limit);
        query += ` ORDER BY o.created_at DESC LIMIT $${params.length}`;

        const orders = await sql(query, ...params);
        return NextResponse.json({ success: true, data: orders });
    } catch (e) {
        console.error('Orders GET error:', e);
        return NextResponse.json({ success: false, error: 'Failed to load orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { session, error } = await requirePermission('pos');
    if (error) return error;
    try {
        const body = await request.json();
        const action = body.action || 'create';

        if (action === 'next_codes') {
            const settings = await getSettings();
            return NextResponse.json({
                success: true,
                data: {
                    invoice_prefix: settings.invoice_prefix || 'CA',
                    fs_number: '00000000',
                    tax_rate: num(settings.tax_rate),
                },
            });
        }

        if (action === 'refund') {
            return refund(body.order_id, session!.id);
        }

        if (action !== 'create') {
            return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
        }

        const {
            customer_id, customer_name, store_id, items, discount,
            payment_method, amount_paid, notes,
        } = body;

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: false, error: 'Order must contain items' }, { status: 400 });
        }

        const settings = await getSettings();
        const taxRate = num(settings.tax_rate ?? 0);

        const productIds = [...new Set(items.map((it: any) => num(it.product_id)).filter((p: number) => p > 0))];
        const valid = await sql(
            `SELECT id, selling_price FROM products WHERE is_active = TRUE AND id = ANY($1)`,
            [productIds],
        );
        if (valid.length !== productIds.length) {
            return NextResponse.json({ success: false, error: 'One or more products are invalid or inactive' }, { status: 400 });
        }
        const priceMap = new Map<number, number>(valid.map((p: any) => [p.id, num(p.selling_price)]));

        let subtotal = 0;
        for (const it of items) {
            subtotal += (priceMap.get(num(it.product_id)) ?? 0) * num(it.quantity);
        }
        const taxAmount = (subtotal * taxRate) / 100;
        const discountValue = discount ? (subtotal * num(discount)) / 100 : 0;
        const total = subtotal + taxAmount - discountValue;
        const isCash = !payment_method || payment_method === 'cash';
        const finalPaid = isCash ? num(amount_paid) : total;
        const changeAmount = isCash ? Math.max(0, finalPaid - total) : 0;

        const orderNumber = await generateOrderNumber();
        const invoiceNumber = await getNextInvoiceNumber();
        const fsNumber = await getNextFsNumber();
        const customer = customer_name ?? settings.pos_customer_default ?? 'Walk-in Customer';

        const results = (await transaction((txn: any) => {
            const qs: any[] = [
                txn`INSERT INTO orders (
                    order_number, user_id, customer_id, customer_name, store_id,
                    subtotal, tax_rate, tax_amount, discount, total,
                    amount_paid, change_amount, payment_method, status,
                    invoice_number, fs_number, notes, created_at
                ) VALUES (
                    ${orderNumber}, ${session!.id}, ${customer_id ?? null}, ${customer}, ${store_id ?? null},
                    ${subtotal}, ${taxRate}, ${taxAmount}, ${discountValue}, ${total},
                    ${finalPaid}, ${changeAmount}, ${payment_method ?? 'cash'}, 'completed',
                    ${invoiceNumber}, ${fsNumber}, ${notes ?? null}, NOW()
                ) RETURNING *`,
            ];
            for (const it of items) {
                const pid = num(it.product_id);
                const qty = num(it.quantity);
                if (!pid || qty <= 0) continue;
                qs.push(
                    txn`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, cost_price, discount, subtotal)
                        SELECT o.id, p.id, p.name, ${qty}, p.selling_price, p.cost_price, 0, p.selling_price * ${qty}
                        FROM products p CROSS JOIN orders o
                        WHERE p.id = ${pid} AND o.order_number = ${orderNumber}`,
                    txn`UPDATE products SET stock_quantity = stock_quantity - ${qty}, updated_at = NOW()
                        WHERE id = ${pid}`,
                    txn`INSERT INTO stock_movements (product_id, movement_type, quantity, reference, notes, created_by, created_at)
                        VALUES (${pid}, 'out', ${qty}, ${orderNumber}, 'Sale', ${session!.id}, NOW())`,
                );
            }
            return qs;
        })) as any[];

        return NextResponse.json({ success: true, data: results[0][0] }, { status: 201 });
    } catch (e: any) {
        console.error('Orders POST error:', e);
        const msg = String(e?.message || e).toLowerCase();
        if (msg.includes('check_stock_non_negative') || msg.includes('exceeds') || msg.includes('stock')) {
            return NextResponse.json({ success: false, error: 'Insufficient stock for one or more items' }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
    }
}

async function refund(orderId: number, userId: number) {
    const orders = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
    if (orders.length === 0) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    if (orders[0].status === 'refunded') {
        return NextResponse.json({ success: false, error: 'Order already refunded' }, { status: 400 });
    }
    const order = orders[0];
    const items = await sql`SELECT * FROM order_items WHERE order_id = ${orderId}`;

    await transaction((txn: any) => {
        const qs: any[] = [
            txn`UPDATE orders SET status = 'refunded' WHERE id = ${orderId}`,
        ];
        for (const it of items) {
            qs.push(
                txn`UPDATE products SET stock_quantity = stock_quantity + ${it.quantity}, updated_at = NOW() WHERE id = ${it.product_id}`,
                txn`INSERT INTO stock_movements (product_id, movement_type, quantity, reference, notes, created_by, created_at)
                    VALUES (${it.product_id}, 'in', ${it.quantity}, ${`REF-${order.order_number}`}, 'Refund of sale', ${userId}, NOW())`,
            );
        }
        return qs;
    });

    return NextResponse.json({ success: true });
}