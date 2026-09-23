import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requirePermission } from '@/lib/auth';
import { generateBarcode } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { error } = await requirePermission('products');
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 50;
    const category_id = searchParams.get('category_id');
    const active_only = searchParams.get('active_only');
    const q = searchParams.get('q');

    let query = `SELECT p.*, c.name as category_name, s.name as supplier_name
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id
                 LEFT JOIN suppliers s ON p.supplier_id = s.id`;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (category_id) {
        params.push(category_id);
        conditions.push(`p.category_id = $${params.length}`);
    }
    if (active_only) {
        conditions.push('p.is_active = TRUE');
    }
    if (q) {
        params.push(`%${q}%`);
        conditions.push(`(p.name ILIKE $${params.length} OR p.barcode ILIKE $${params.length} OR p.item_code ILIKE $${params.length})`);
    }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    params.push(limit);
    query += ` ORDER BY p.name ASC LIMIT $${params.length}`;

    const rows = await sql(query, ...params);
    return NextResponse.json({ success: true, data: rows });
}

export async function POST(request: Request) {
    const { error } = await requirePermission('products');
    if (error) return error;
    try {
        const body = await request.json();
        const {
            barcode, item_code, name, description, category_id,
            supplier_id, cost_price, selling_price, stock_quantity,
            min_stock, unit, image, is_active,
        } = body;
        if (!name || selling_price == null) {
            return NextResponse.json({ success: false, error: 'Name and selling price are required' }, { status: 400 });
        }
        const finalBarcode = barcode || (await generateBarcode());
        const result = await sql`
            INSERT INTO products (
                barcode, item_code, name, description, category_id,
                supplier_id, cost_price, selling_price, stock_quantity,
                min_stock, unit, image, is_active, created_at
            ) VALUES (
                ${finalBarcode}, ${item_code ?? null}, ${name}, ${description ?? null}, ${category_id ?? null},
                ${supplier_id ?? null}, ${cost_price ?? 0}, ${selling_price}, ${stock_quantity ?? 0},
                ${min_stock ?? 5}, ${unit ?? 'pcs'}, ${image || null}, ${is_active ?? true}, NOW()
            ) RETURNING *`;
        return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const { error } = await requirePermission('products');
    if (error) return error;
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
        const body = await request.json();
        const result = await sql`
            UPDATE products
            SET barcode = ${body.barcode ?? null}, item_code = ${body.item_code ?? null}, name = ${body.name},
                description = ${body.description ?? null}, category_id = ${body.category_id ?? null},
                supplier_id = ${body.supplier_id ?? null}, cost_price = ${body.cost_price ?? 0},
                selling_price = ${body.selling_price}, stock_quantity = ${body.stock_quantity ?? 0},
                min_stock = ${body.min_stock ?? 5}, unit = ${body.unit ?? 'pcs'},
                image = ${body.image || null}, is_active = ${body.is_active ?? true}, updated_at = NOW()
            WHERE id = ${id}
            RETURNING *`;
        if (result.length === 0) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: result[0] });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { error } = await requirePermission('products');
    if (error) return error;
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
        await sql`DELETE FROM products WHERE id = ${id}`;
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to delete product' }, { status: 500 });
    }
}