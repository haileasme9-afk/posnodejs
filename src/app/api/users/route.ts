import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/neon';
import { requirePermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const { error } = await requirePermission('users');
    if (error) return error;
    const rows = await sql`SELECT id, username, full_name, email, phone, role, role_id, is_active, created_at
                           FROM users ORDER BY full_name ASC`;
    return NextResponse.json({ success: true, data: rows });
}

export async function POST(request: Request) {
    const { error } = await requirePermission('users');
    if (error) return error;
    try {
        const body = await request.json();
        const { username, password, full_name, email, phone, role } = body;
        if (!username || !password || !full_name) {
            return NextResponse.json({ success: false, error: 'Username, password and full name are required' }, { status: 400 });
        }
        const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
        if (existing.length > 0) {
            return NextResponse.json({ success: false, error: 'Username already taken' }, { status: 400 });
        }
        const hash = await bcrypt.hash(password, 10);
        const result = await sql`
            INSERT INTO users (username, password, full_name, email, phone, role, role_id, is_active, created_at)
            VALUES (${username}, ${hash}, ${full_name}, ${email ?? null}, ${phone ?? null}, ${role ?? 'cashier'},
                    ${role === 'admin' ? 1 : role === 'manager' ? 2 : 3}, TRUE, NOW())
            RETURNING id, username, full_name, email, phone, role, role_id, is_active`;
        return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const { error } = await requirePermission('users');
    if (error) return error;
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
        const body = await request.json();
        const roleId = body.role === 'admin' ? 1 : body.role === 'manager' ? 2 : 3;

        let result;
        if (body.password) {
            const hash = await bcrypt.hash(body.password, 10);
            result = await sql`
                UPDATE users SET password = ${hash},
                    full_name = ${body.full_name}, email = ${body.email ?? null},
                    phone = ${body.phone ?? null}, role = ${body.role ?? 'cashier'},
                    role_id = ${body.role ? roleId : null}, is_active = ${body.is_active ?? true}, updated_at = NOW()
                WHERE id = ${id}
                RETURNING id, username, full_name, email, phone, role, role_id, is_active`;
        } else {
            result = await sql`
                UPDATE users SET full_name = ${body.full_name}, email = ${body.email ?? null},
                    phone = ${body.phone ?? null}, role = ${body.role ?? 'cashier'},
                    role_id = ${body.role ? roleId : null}, is_active = ${body.is_active ?? true}, updated_at = NOW()
                WHERE id = ${id}
                RETURNING id, username, full_name, email, phone, role, role_id, is_active`;
        }
        if (result.length === 0) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: result[0] });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { error } = await requirePermission('users');
    if (error) return error;
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
        await sql`UPDATE users SET is_active = FALSE WHERE id = ${id}`;
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
    }
}