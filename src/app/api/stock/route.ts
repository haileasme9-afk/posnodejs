import { sql } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get('product_id');
    const low_stock = searchParams.get('low_stock');

    try {
        let query = `SELECT p.id, p.name, p.stock_quantity, p.min_stock, 
                           (p.stock_quantity <= p.min_stock) as is_low_stock
                    FROM products p`;
        const params = [];
        const conditions = [];

        if (product_id) {
            conditions.push(`p.id = $${params.length + 1}`);
            params.push(product_id);
        }

        if (low_stock === 'true') {
            conditions.push(`p.stock_quantity <= p.min_stock`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const products = await sql(query, ...params);

        return new Response(JSON.stringify({ success: true, data: products }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching stock:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch stock' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { product_id, movement_type, quantity, reference, notes, created_by } = body;

        // Validate product exists
        const product = await sql`SELECT id, stock_quantity FROM products WHERE id = ${product_id}`;
        
        if (product.length === 0) {
            return new Response(JSON.stringify({ success: false, error: 'Product not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Coerce: JSON bodies and DECIMAL columns both arrive as strings.
        const amount = Number(quantity ?? 0);
        let newStock = Number(product[0].stock_quantity ?? 0);

        // Update stock based on movement type
        if (movement_type === 'in') {
            newStock += amount;
        } else if (movement_type === 'out') {
            newStock -= amount;
            if (newStock < 0) {
                return new Response(JSON.stringify({ success: false, error: 'Insufficient stock' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        } else if (movement_type === 'adjustment') {
            newStock = amount;
        }

        // Update product stock
        await sql`UPDATE products SET stock_quantity = ${newStock}, updated_at = NOW() WHERE id = ${product_id}`;

        // Create stock movement record
        const result = await sql`
            INSERT INTO stock_movements (product_id, movement_type, quantity, reference, notes, created_by, created_at)
            VALUES (${product_id}, ${movement_type}, ${amount}, ${reference}, ${notes}, ${created_by}, NOW())
            RETURNING *;
        `;

        return new Response(JSON.stringify({ success: true, data: result[0] }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error updating stock:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to update stock' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}