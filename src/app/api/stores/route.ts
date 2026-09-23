import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requirePermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const { error } = await requirePermission('settings');
    if (error) return error;
    const rows = await sql`SELECT * FROM stores ORDER BY is_default DESC, name ASC`;
    return NextResponse.json({ success: true, data: rows });
}

export async function POST(request: Request) {
    const { error } = await requirePermission('settings');
    if (error) return error;
    try {
        const body = await request.json();
        const { name, address, phone, email, manager, is_default, is_active } = body;
        if (!name) return NextResponse.json({ success: false, error: 'Store name is required' }, { status: 400 });

        if (is_default) {
            await sql`UPDATE stores SET is_default = FALSE`;
        }
        const result = await sql`
            INSERT INTO stores (name, address, phone, email, manager, is_default, is_active)
            VALUES (${name}, ${address ?? null}, ${phone ?? null}, ${email ?? null}, ${manager ?? null},
                    ${is_default ?? false}, ${is_active ?? true})
            RETURNING *`;
        return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to create store' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const { error } = await requirePermission('settings');
    if (error) return error;
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Store ID required' }, { status: 400 });
        const body = await request.json();
        if (body.is_default) {
            await sql`UPDATE stores SET is_default = FALSE`;
        }
        const result = await sql`
            UPDATE stores SET name = ${body.name}, address = ${body.address ?? null}, phone = ${body.phone ?? null},
                email = ${body.email ?? null}, manager = ${body.manager ?? null},
                is_default = ${body.is_default ?? false}, is_active = ${body.is_active ?? true}
            WHERE id = ${id} RETURNING *`;
        if (result.length === 0) return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: result[0] });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to update store' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { error } = await requirePermission('settings');
    if (error) return error;
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Store ID required' }, { status: 400 });
        await sql`UPDATE stores SET is_active = FALSE WHERE id = ${id}`;
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to delete store' }, { status: 500 });
    }
}