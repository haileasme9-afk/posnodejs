import { sql } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 50;
    const active_only = searchParams.get('active_only');

    try {
        let query = `SELECT * FROM users WHERE role IN ('admin', 'cashier', 'manager')`;
        const params = [];
        const conditions = [];

        if (active_only) {
            conditions.push(`is_active = TRUE`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` LIMIT $${params.length + 1}`;
        params.push(limit);

        const customers = await sql(query, ...params);

        return new Response(JSON.stringify({ success: true, data: customers }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch customers' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password, full_name, email, role } = body;

        const hashedPassword = password; // In production, hash this

        const result = await sql`
            INSERT INTO users (username, password, full_name, email, role, is_active, created_at)
            VALUES (${username}, ${hashedPassword}, ${full_name}, ${email}, ${role}, TRUE, NOW())
            RETURNING id, username, full_name, email, role, is_active;
        `;

        return new Response(JSON.stringify({ success: true, data: result[0] }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error creating user:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to create user' }), {
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
            return new Response(JSON.stringify({ success: false, error: 'User ID required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const body = await request.json();
        const { full_name, email, role, is_active } = body;

        const result = await sql`
            UPDATE users 
            SET full_name = ${full_name}, email = ${email}, role = ${role}, is_active = ${is_active}, updated_at = NOW()
            WHERE id = ${id}
            RETURNING id, username, full_name, email, role, is_active;
        `;

        if (result.length === 0) {
            return new Response(JSON.stringify({ success: false, error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ success: true, data: result[0] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to update user' }), {
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
            return new Response(JSON.stringify({ success: false, error: 'User ID required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await sql`DELETE FROM users WHERE id = ${id}`;

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to delete user' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}