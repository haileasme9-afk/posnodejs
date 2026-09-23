import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requirePermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const { error } = await requirePermission('suppliers');
    if (error) return error;
    const rows = await sql`SELECT * FROM suppliers ORDER BY name ASC`;
    return NextResponse.json({ success: true, data: rows });
}

export async function POST(request: Request) {
    const { error } = await requirePermission('suppliers');
    if (error) return error;
    try {
        const body = await request.json();
        const { name, contact_person, phone, email, address, is_active } = body;
        if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        const result = await sql`
            INSERT INTO suppliers (name, contact_person, phone, email, address, is_active)
            VALUES (${name}, ${contact_person ?? null}, ${phone ?? null}, ${email ?? null}, ${address ?? null}, ${is_active ?? true})
            RETURNING *`;
        return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to create supplier' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const { error } = await requirePermission('suppliers');
    if (error) return error;
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Supplier ID required' }, { status: 400 });
        const body = await request.json();
        const result = await sql`
            UPDATE suppliers SET name = ${body.name}, contact_person = ${body.contact_person ?? null},
                phone = ${body.phone ?? null}, email = ${body.email ?? null},
                address = ${body.address ?? null}, is_active = ${body.is_active ?? true}
            WHERE id = ${id} RETURNING *`;
        if (result.length === 0) return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: result[0] });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to update supplier' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { error } = await requirePermission('suppliers');
    if (error) return error;
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Supplier ID required' }, { status: 400 });
        const used = await sql`SELECT count(*)::int AS n FROM products WHERE supplier_id = ${id}`;
        if (used[0].n > 0) {
            return NextResponse.json({ success: false, error: 'Supplier has products and cannot be deleted' }, { status: 400 });
        }
        await sql`DELETE FROM suppliers WHERE id = ${id}`;
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to delete supplier' }, { status: 500 });
    }
}