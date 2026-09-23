import { NextResponse } from 'next/server';
import { sql, transaction } from '@/lib/neon';
import { requirePermission } from '@/lib/auth';
import { num } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { error } = await requirePermission('receiving');
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        if (id) {
            const rows = await sql`SELECT r.*, s.name AS supplier_name, st.name AS store_name, u.full_name AS user_name
                                    FROM stock_receivings r
                                    LEFT JOIN suppliers s ON r.supplier_id = s.id
                                    LEFT JOIN stores st ON r.store_id = st.id
                                    LEFT JOIN users u ON r.created_by = u.id
                                    WHERE r.id = ${id}`;
            if (rows.length === 0) {
                return NextResponse.json({ success: false, error: 'Receiving not found' }, { status: 404 });
            }
            const items = await sql`SELECT ri.*, p.name AS product_name, p.barcode
                                    FROM stock_receiving_items ri
                                    LEFT JOIN products p ON ri.product_id = p.id
                                    WHERE ri.receiving_id = ${id}`;
            return NextResponse.json({ success: true, data: { ...rows[0], items } });
        }

        const rows = await sql`SELECT r.*, s.name AS supplier_name, st.name AS store_name
                                FROM stock_receivings r
                                LEFT JOIN suppliers s ON r.supplier_id = s.id
                                LEFT JOIN stores st ON r.store_id = st.id
                                ORDER BY r.created_at DESC LIMIT 50`;
        return NextResponse.json({ success: true, data: rows });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to load receivings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { session, error } = await requirePermission('receiving');
    if (error) return error;
    try {
        const body = await request.json();
        const { store_id, supplier_id, items, notes, reference } = body;
        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: false, error: 'Receiving must contain items' }, { status: 400 });
        }

        const ref = reference || `RCV-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}`;

        let itemCount = 0;
        let totalCost = 0;
        for (const it of items) {
            itemCount += num(it.quantity);
            totalCost += num(it.unit_cost) * num(it.quantity);
        }

        const productIds = [...new Set(items.map((it: any) => num(it.product_id)).filter((p: number) => p > 0))];
        const valid = await sql(
            `SELECT id FROM products WHERE id = ANY($1)`,
            [productIds],
        );
        if (valid.length !== productIds.length) {
            return NextResponse.json({ success: false, error: 'One or more products are invalid' }, { status: 400 });
        }

        await transaction((txn: any) => {
            const qs: any[] = [
                txn`INSERT INTO stock_receivings (reference, store_id, supplier_id, total_cost, item_count, notes, created_by, created_at)
                    VALUES (${ref}, ${store_id ?? null}, ${supplier_id ?? null}, ${totalCost}, ${itemCount}, ${notes ?? null}, ${session!.id}, NOW())`,
            ];
            for (const it of items) {
                const pid = num(it.product_id);
                const qty = num(it.quantity);
                const unitCost = num(it.unit_cost);
                if (!pid || qty <= 0) continue;
                qs.push(
                    txn`INSERT INTO stock_receiving_items (receiving_id, product_id, quantity, unit_cost, line_total)
                        SELECT r.id, ${pid}, ${qty}, ${unitCost}, ${unitCost * qty}
                        FROM stock_receivings r WHERE r.reference = ${ref}`,
                    txn`UPDATE products SET stock_quantity = stock_quantity + ${qty}, cost_price = ${unitCost}, updated_at = NOW()
                        WHERE id = ${pid}`,
                    txn`INSERT INTO stock_movements (product_id, movement_type, quantity, reference, notes, created_by, created_at)
                        VALUES (${pid}, 'in', ${qty}, ${ref}, 'Stock receiving', ${session!.id}, NOW())`,
                );
            }
            return qs;
        });

        const created = await sql`SELECT * FROM stock_receivings WHERE reference = ${ref}`;
        return NextResponse.json({ success: true, data: created[0] }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to create receiving' }, { status: 500 });
    }
}