import { sql } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    try {
        if (key) {
            const result = await sql`SELECT setting_value FROM settings WHERE setting_key = ${key}`;
            
            if (result.length === 0) {
                return new Response(JSON.stringify({ success: false, error: 'Setting not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({ success: true, data: result[0] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Fetch all settings
        const results = await sql`SELECT setting_key, setting_value FROM settings`;
        const settings = {};
        
        results.forEach((r: any) => {
            settings[r.setting_key] = r.setting_value;
        });

        return new Response(JSON.stringify({ success: true, data: settings }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch settings' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { key, value } = body;

        if (!key) {
            return new Response(JSON.stringify({ success: false, error: 'Setting key required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const result = await sql`
            INSERT INTO settings (setting_key, setting_value, updated_at)
            VALUES (${key}, ${value}, NOW())
            ON CONFLICT (setting_key) 
            DO UPDATE SET setting_value = ${value}, updated_at = NOW()
            RETURNING *;
        `;

        return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error saving setting:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to save setting' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}