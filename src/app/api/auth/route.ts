import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/neon';
import { setSession, destroySession, getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
        if (!username || !password) {
            return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
        }

        const rows = await sql`SELECT id, username, password, full_name, role, role_id, is_active FROM users WHERE username = ${username} AND is_active = TRUE`;
        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
        }

        const user = rows[0];
        const stored = String(user.password);
        let ok = false;
        try {
            ok = await bcrypt.compare(password, stored);
        } catch {
            ok = false;
        }
        if (!ok && stored === password) {
            ok = true;
        }
        if (!ok) {
            return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
        }

        if (stored === password && !stored.startsWith('$2')) {
            const hash = await bcrypt.hash(password, 10);
            await sql`UPDATE users SET password = ${hash} WHERE id = ${user.id}`;
        }

        await setSession({
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
            role_id: user.role_id,
        });

        return NextResponse.json({
            success: true,
            data: { id: user.id, username: user.username, full_name: user.full_name, role: user.role },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
    }
}

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ success: true, data: session });
}

export async function DELETE() {
    await destroySession();
    return NextResponse.json({ success: true });
}