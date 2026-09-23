import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requirePermission } from '@/lib/auth';
import { num } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { error } = await requirePermission('stock');
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'list';
    const product_id = searchParams.get('product_id');
    const low_stock = searchParams.get('low_stock');

    try {
        if (view === 'movements') {
            let query = `SELECT m.*, p.name AS product_name, p.barcode, u.full_name AS created_by_name
                         FROM stock_movements m
                         LEFT JOIN products p ON m.product_id = p.id
                         LEFT JOIN users u ON m.created_by = u.id`;
            const params: unknown[] = [];
            const conditions: string[] = [];
            if (product_id) {
                params.push(product_id);
                conditions.push(`m.product_id = $${params.length}`);
            }
            if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
            query += ' ORDER BY m.created_at DESC LIMIT 200';
            const rows = params.length ? await sql(query, ...params) : await sql(query);
            return NextResponse.json({ success: true, data: rows });
        }

        let query = `SELECT p.id, p.name, p.barcode, p.stock_quantity, p.min_stock, p.cost_price, p.selling_price,
                            c.name AS category_name,
                            (p.stock_quantity <= p.min_stock) AS is_low_stock
                     FROM products p LEFT JOIN categories c ON p.category_id = c.id`;
        const params: unknown[] = [];
        const conditions: string[] = [];
        if (product_id) {
            params.push(product_id);
            conditions.push(`p.id = $${params.length}`);
        }
        if (low_stock === 'true') {
            conditions.push(`p.stock_quantity <= p.min_stock`);
        }
        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY p.stock_quantity ASC, p.name ASC';
        const rows = params.length ? await sql(query, ...params) : await sql(query);
        return NextResponse.json({ success: true, data: rows });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to fetch stock' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { session, error } = await requirePermission('stock');
    if (error) return error;
    try {
        const body = await request.json();
        const { product_id, movement_type, quantity, reference, notes } = body;
        if (!product_id || !movement_type || quantity == null) {
            return NextResponse.json({ success: false, error: 'Product, movement type and quantity are required' }, { status: 400 });
        }

        const product = await sql`SELECT id, stock_quantity FROM products WHERE id = ${product_id}`;
        if (product.length === 0) {
            return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
        }

        if (movement_type === 'adjustment') {
            const newStock = num(quantity);
            if (newStock < 0) {
                return NextResponse.json({ success: false, error: 'Adjusted stock cannot be negative' }, { status: 400 });
            }
            await sql`UPDATE products SET stock_quantity = ${newStock}, updated_at = NOW() WHERE id = ${product_id}`;
        } else {
            const delta = num(quantity);
            if (movement_type === 'out') {
                await sql`UPDATE products SET stock_quantity = stock_quantity - ${delta}, updated_at = NOW()
                          WHERE id = ${product_id} AND stock_quantity >= ${delta}`;
                const check = await sql`SELECT stock_quantity FROM products WHERE id = ${product_id}`;
                if (check.length && num(check[0].stock_quantity) < 0) {
                    return NextResponse.json({ success: false, error: 'Insufficient stock' }, { status: 400 });
                }
            } else {
                await sql`UPDATE products SET stock_quantity = stock_quantity + ${delta}, updated_at = NOW() WHERE id = ${product_id}`;
            }
        }

        const result = await sql`
            INSERT INTO stock_movements (product_id, movement_type, quantity, reference, notes, created_by, created_at)
            VALUES (${product_id}, ${movement_type}, ${movement_type === 'adjustment' ? num(quantity) : num(quantity)}, ${reference ?? null}, ${notes ?? null}, ${session!.id}, NOW())
            RETURNING *`;
        return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to update stock' }, { status: 500 });
    }
}