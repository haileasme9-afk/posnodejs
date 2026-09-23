import { sql } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const from_store_id = searchParams.get('from_store_id');
    const to_store_id = searchParams.get('to_store_id');

    try {
        let query = `SELECT st.*, s1.name as from_store_name, s2.name as to_store_name,
                             (SELECT COALESCE(SUM(quantity), 0) FROM store_transfer_items WHERE transfer_id = st.id) as total_items
                      FROM store_transfers st
                      LEFT JOIN stores s1 ON st.from_store_id = s1.id
                      LEFT JOIN stores s2 ON st.to_store_id = s2.id`;
        const params = [];
        const conditions = [];

        if (status) {
            conditions.push(`st.status = $${params.length + 1}`);
            params.push(status);
        }

        if (from_store_id) {
            conditions.push(`st.from_store_id = $${params.length + 1}`);
            params.push(from_store_id);
        }

        if (to_store_id) {
            conditions.push(`st.to_store_id = $${params.length + 1}`);
            params.push(to_store_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY st.created_at DESC`;

        const transfers = await sql(query, ...params);

        return new Response(JSON.stringify({ success: true, data: transfers }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching transfers:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch transfers' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { from_store_id, to_store_id, items, notes, created_by } = body;

        // Validate stores exist
        const fromStore = await sql`SELECT id, name FROM stores WHERE id = ${from_store_id}`;
        const toStore = await sql`SELECT id, name FROM stores WHERE id = ${to_store_id}`;

        if (fromStore.length === 0) {
            return new Response(JSON.stringify({ success: false, error: 'From store not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (toStore.length === 0) {
            return new Response(JSON.stringify({ success: false, error: 'To store not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Generate reference number
        const reference = `TRF${Date.now().toString().slice(-6)}`;

        // Calculate total values
        let total_items = 0;
        let total_value = 0;

        // Insert transfer
        const result = await sql`
            INSERT INTO store_transfers (reference, from_store_id, to_store_id, status, total_items, total_value, notes, created_by, created_at)
            VALUES (${reference}, ${from_store_id}, ${to_store_id}, 'pending', 0, 0, ${notes}, ${created_by}, NOW())
            RETURNING *;
        `;

        const transfer = result[0];

        // Insert transfer items
        if (items && items.length > 0) {
            for (const item of items) {
                const product = await sql`SELECT id, name, selling_price, stock_quantity FROM products WHERE id = ${item.product_id}`;
                
                if (product.length === 0) {
                    return new Response(JSON.stringify({ success: false, error: `Product ${item.product_id} not found` }), {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }

                const unit_cost = Number(product[0].selling_price ?? 0);
                const qty = Number(item.quantity ?? 0);
                const line_total = unit_cost * qty;

                await sql`
                    INSERT INTO store_transfer_items (transfer_id, product_id, quantity, unit_cost, line_total)
                    VALUES (${transfer.id}, ${item.product_id}, ${qty}, ${unit_cost}, ${line_total});
                `;

                // Update product stock at source store (we'd need store_product inventory tracking)
                // For now, just track the transfer
                total_items += qty;
                total_value += line_total;
            }

            // Update transfer with totals
            await sql`
                UPDATE store_transfers 
                SET total_items = ${total_items}, total_value = ${total_value}, status = 'pending'
                WHERE id = ${transfer.id};
            `;
        }

        return new Response(JSON.stringify({ success: true, data: transfer }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error creating transfer:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to create transfer' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}