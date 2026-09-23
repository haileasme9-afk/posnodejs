import { sql } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10;

    try {
        const params: unknown[] = [];
        let where = '';

        // The WHERE clause has to come before ORDER BY, otherwise Postgres
        // rejects the statement as soon as a status filter is supplied.
        if (status) {
            where = ` WHERE o.status = $${params.length + 1}`;
            params.push(status);
        }

        let query = `SELECT o.*, u.full_name as user_name, s.name as store_name 
                     FROM orders o 
                     LEFT JOIN users u ON o.user_id = u.id 
                     LEFT JOIN stores s ON o.store_id = s.id${where}
                     ORDER BY o.created_at DESC`;

        query += ` LIMIT $${params.length + 1}`;
        params.push(limit);

        const orders = await sql(query, ...params);

        return new Response(JSON.stringify({ success: true, data: orders }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch orders' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            user_id, customer_name, subtotal, tax_rate, tax_amount,
            discount, total, payment_method, status, notes,
            store_id, invoice_number, fs_number, payment_reference,
            customer_id, amount_paid, change_amount, items
        } = body;

        // Generate order number if not provided
        const orderNumber = invoice_number || `ORD${new Date().toISOString().slice(0, 6)}${Math.floor(Math.random() * 9000) + 1000}`;

        // Generate invoice number if not provided
        const invoiceNum = invoice_number || `CA-${Math.floor(Math.random() * 90000000) + 10000000}`;

        // Generate FS number if not provided
        const fsNum = fs_number || Math.floor(Math.random() * 90000000).toString().padStart(8, '0');

        const result = await sql`
            INSERT INTO orders (
                order_number, user_id, customer_name, subtotal, tax_rate, tax_amount,
                discount, total, amount_paid, change_amount, payment_method, status, notes, store_id,
                invoice_number, fs_number, payment_reference, customer_id, created_at
            ) VALUES (
                ${orderNumber}, ${user_id}, ${customer_name}, ${subtotal}, ${tax_rate}, ${tax_amount},
                ${discount}, ${total}, ${amount_paid ?? total ?? 0}, ${change_amount ?? 0},
                ${payment_method}, ${status}, ${notes}, ${store_id},
                ${invoiceNum}, ${fsNum}, ${payment_reference}, ${customer_id}, NOW()
            )
            RETURNING *;
        `;

        const order = result[0];

        // Optional line items — without them the receipt has no breakdown and
        // the "top products" report stays empty.
        if (Array.isArray(items) && items.length > 0) {
            for (const item of items) {
                await sql`
                    INSERT INTO order_items (
                        order_id, product_id, product_name, quantity,
                        unit_price, cost_price, discount, subtotal
                    ) VALUES (
                        ${order.id}, ${item.product_id}, ${item.product_name}, ${item.quantity},
                        ${item.unit_price}, ${item.cost_price ?? 0}, ${item.discount ?? 0},
                        ${item.subtotal}
                    );
                `;
            }
        }

        return new Response(JSON.stringify({ success: true, data: order }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to create order' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}