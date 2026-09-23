import { sql } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 50;
    const category_id = searchParams.get('category_id');
    const active_only = searchParams.get('active_only');

    try {
        let query = `SELECT p.*, c.name as category_name 
                     FROM products p 
                     LEFT JOIN categories c ON p.category_id = c.id`;
        const params = [];
        const conditions = [];

        if (category_id) {
            conditions.push(`p.category_id = $${params.length + 1}`);
            params.push(category_id);
        }

        if (active_only) {
            conditions.push(`p.is_active = TRUE`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` LIMIT $${params.length + 1}`;
        params.push(limit);

        const products = await sql(query, ...params);

        return new Response(JSON.stringify({ success: true, data: products }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch products' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            barcode, item_code, name, description, category_id,
            supplier_id, cost_price, selling_price, stock_quantity,
            min_stock, unit, is_active
        } = body;

        const result = await sql`
            INSERT INTO products (
                barcode, item_code, name, description, category_id,
                supplier_id, cost_price, selling_price, stock_quantity,
                min_stock, unit, is_active, created_at
            ) VALUES (
                ${barcode}, ${item_code}, ${name}, ${description}, ${category_id},
                ${supplier_id}, ${cost_price}, ${selling_price}, ${stock_quantity},
                ${min_stock}, ${unit}, ${is_active ?? true}, NOW()
            )
            RETURNING *;
        `;

        return new Response(JSON.stringify({ success: true, data: result }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error creating product:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to create product' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) {
            return new Response(JSON.stringify({ success: false, error: 'Product ID required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const body = await request.json();
        const {
            barcode, item_code, name, description, category_id,
            supplier_id, cost_price, selling_price, stock_quantity,
            min_stock, unit, is_active
        } = body;

        const result = await sql`
            UPDATE products 
            SET barcode = ${barcode}, item_code = ${item_code}, name = ${name},
                description = ${description}, category_id = ${category_id},
                supplier_id = ${supplier_id}, cost_price = ${cost_price},
                selling_price = ${selling_price}, stock_quantity = ${stock_quantity},
                min_stock = ${min_stock}, unit = ${unit}, is_active = ${is_active},
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *;
        `;

        if (result.length === 0) {
            return new Response(JSON.stringify({ success: false, error: 'Product not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ success: true, data: result[0] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error updating product:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to update product' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ success: false, error: 'Product ID required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await sql`DELETE FROM products WHERE id = ${id}`;

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to delete product' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}