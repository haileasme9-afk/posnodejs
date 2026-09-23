import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requirePermission } from '@/lib/auth';
import { num } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { error } = await requirePermission('pos');
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        if (id) {
            const rows = await sql`SELECT * FROM held_orders WHERE id = ${id}`;
            if (rows.length === 0) return NextResponse.json({ success: false, error: 'Held order not found' }, { status: 404 });
            return NextResponse.json({ success: true, data: rows[0] });
        }
        const rows = await sql`SELECT h.*, u.full_name AS user_name
                                FROM held_orders h
                                LEFT JOIN users u ON h.user_id = u.id
                                ORDER BY h.held_at DESC LIMIT 50`;
        return NextResponse.json({ success: true, data: rows });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to load held orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { session, error } = await requirePermission('pos');
    if (error) return error;
    try {
        const body = await request.json();
        const action = body.action || 'hold';

        if (action === 'delete') {
            await sql`DELETE FROM held_orders WHERE id = ${body.id}`;
            return NextResponse.json({ success: true });
        }

        if (action !== 'hold') {
            return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
        }

        const { customer_id, customer_name, cart_data, subtotal, tax_amount, discount, total, notes } = body;
        if (!cart_data) {
            return NextResponse.json({ success: false, error: 'Cart data is required' }, { status: 400 });
        }

        const result = await sql`
            INSERT INTO held_orders (user_id, store_id, customer_id, customer_name, cart_data,
                subtotal, tax_amount, discount, total, notes, held_at)
            VALUES (${session!.id}, ${body.store_id ?? null}, ${customer_id ?? null}, ${customer_name ?? null},
                ${typeof cart_data === 'string' ? cart_data : JSON.stringify(cart_data)},
                ${num(subtotal)}, ${num(tax_amount)}, ${num(discount)}, ${num(total)}, ${notes ?? null}, NOW())
            RETURNING *`;
        return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to hold order' }, { status: 500 });
    }
}