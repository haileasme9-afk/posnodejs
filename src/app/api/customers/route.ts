import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requirePermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { error } = await requirePermission('customers');
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const active_only = searchParams.get('active_only');

    let query = `SELECT * FROM customers WHERE TRUE`;
    const params: unknown[] = [];
    if (active_only) query += ` AND is_active = TRUE`;
    if (q) {
        params.push(`%${q}%`);
        query += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length} OR company ILIKE $${params.length})`;
    }
    query += ` ORDER BY name ASC`;

    const rows = params.length > 0 ? await sql(query, ...params) : await sql(query);
    return NextResponse.json({ success: true, data: rows });
}

export async function POST(request: Request) {
    const { error } = await requirePermission('customers');
    if (error) return error;
    try {
        const body = await request.json();
        const { name, phone, email, address, company, tax_number, notes, is_active } = body;
        if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        const result = await sql`
            INSERT INTO customers (name, phone, email, address, company, tax_number, notes, is_active)
            VALUES (${name}, ${phone ?? null}, ${email ?? null}, ${address ?? null}, ${company ?? null},
                    ${tax_number ?? null}, ${notes ?? null}, ${is_active ?? true})
            RETURNING *`;
        return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to create customer' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const { error } = await requirePermission('customers');
    if (error) return error;
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Customer ID required' }, { status: 400 });
        const body = await request.json();
        const result = await sql`
            UPDATE customers SET name = ${body.name}, phone = ${body.phone ?? null}, email = ${body.email ?? null},
                address = ${body.address ?? null}, company = ${body.company ?? null},
                tax_number = ${body.tax_number ?? null}, notes = ${body.notes ?? null},
                is_active = ${body.is_active ?? true}
            WHERE id = ${id} RETURNING *`;
        if (result.length === 0) return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: result[0] });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to update customer' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { error } = await requirePermission('customers');
    if (error) return error;
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Customer ID required' }, { status: 400 });
        await sql`UPDATE customers SET is_active = FALSE WHERE id = ${id}`;
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to delete customer' }, { status: 500 });
    }
}