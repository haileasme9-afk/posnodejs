import { NextResponse } from 'next/server';
import { sql, transaction } from '@/lib/neon';
import { requirePermission } from '@/lib/auth';
import { num } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

async function makeReference() {
    const d = new Date();
    const pad = (x: number) => String(x).padStart(2, '0');
    const dateStr = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const rows = await sql`SELECT count(*)::int AS n FROM store_transfers WHERE reference LIKE ${`TRF${dateStr}%`}`;
    return `TRF${dateStr}${String((rows[0]?.n ?? 0) + 1).padStart(4, '0')}`;
}

export async function GET(request: Request) {
    const { error } = await requirePermission('transfers');
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        if (id) {
            const rows = await sql`SELECT st.*, s1.name AS from_store_name, s2.name AS to_store_name, u.full_name AS user_name
                                    FROM store_transfers st
                                    LEFT JOIN stores s1 ON st.from_store_id = s1.id
                                    LEFT JOIN stores s2 ON st.to_store_id = s2.id
                                    LEFT JOIN users u ON st.created_by = u.id
                                    WHERE st.id = ${id}`;
            if (rows.length === 0) {
                return NextResponse.json({ success: false, error: 'Transfer not found' }, { status: 404 });
            }
            const items = await sql`SELECT ti.*, p.name AS product_name, p.barcode
                                    FROM store_transfer_items ti
                                    LEFT JOIN products p ON ti.product_id = p.id
                                    WHERE ti.transfer_id = ${id}`;
            return NextResponse.json({ success: true, data: { ...rows[0], items } });
        }

        const rows = await sql`SELECT st.*, s1.name AS from_store_name, s2.name AS to_store_name,
                                       (SELECT COALESCE(SUM(quantity), 0) FROM store_transfer_items WHERE transfer_id = st.id) AS total_items
                                FROM store_transfers st
                                LEFT JOIN stores s1 ON st.from_store_id = s1.id
                                LEFT JOIN stores s2 ON st.to_store_id = s2.id
                                ORDER BY st.created_at DESC LIMIT 100`;
        return NextResponse.json({ success: true, data: rows });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to load transfers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { session, error } = await requirePermission('transfers');
    if (error) return error;
    try {
        const body = await request.json();
        const action = body.action || 'create';

        if (action === 'complete') return complete(session!.id, body.transfer_id);
        if (action === 'cancel') {
            const r = await sql`UPDATE store_transfers SET status = 'cancelled' WHERE id = ${body.transfer_id} AND status = 'pending'`;
            if (r.length === 0) return NextResponse.json({ success: false, error: 'Transfer not found or not pending' }, { status: 400 });
            return NextResponse.json({ success: true });
        }
        if (action === 'delete') {
            const check = await sql`SELECT status FROM store_transfers WHERE id = ${body.transfer_id}`;
            if (check.length === 0) return NextResponse.json({ success: false, error: 'Transfer not found' }, { status: 404 });
            if (check[0].status === 'completed') {
                return NextResponse.json({ success: false, error: 'Completed transfers cannot be deleted' }, { status: 400 });
            }
            await sql`DELETE FROM store_transfers WHERE id = ${body.transfer_id}`;
            return NextResponse.json({ success: true });
        }
        if (action !== 'create') {
            return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
        }

        const { from_store_id, to_store_id, items, notes } = body;
        if (!from_store_id || !to_store_id) {
            return NextResponse.json({ success: false, error: 'Source and destination stores are required' }, { status: 400 });
        }
        if (from_store_id === to_store_id) {
            return NextResponse.json({ success: false, error: 'Source and destination stores must differ' }, { status: 400 });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: false, error: 'Transfer must contain items' }, { status: 400 });
        }

        const reference = await makeReference();
        let totalItems = 0;
        let totalValue = 0;

        const productIds = [...new Set(items.map((it: any) => num(it.product_id)).filter((p: number) => p > 0))];
        const products = await sql(`SELECT id, name, selling_price FROM products WHERE id = ANY($1)`, [productIds]);
        const priceMap = new Map<number, number>(products.map((p: any) => [p.id, num(p.selling_price)]));

        for (const it of items) {
            const pid = num(it.product_id);
            const qty = num(it.quantity);
            if (!pid || qty <= 0) continue;
            totalItems += qty;
            totalValue += (priceMap.get(pid) ?? 0) * qty;
        }

        await transaction((txn: any) => {
            const qs: any[] = [
                txn`INSERT INTO store_transfers (reference, from_store_id, to_store_id, status, total_items, total_value, notes, created_by, created_at)
                    VALUES (${reference}, ${from_store_id}, ${to_store_id}, 'pending', ${totalItems}, ${totalValue}, ${notes ?? null}, ${session!.id}, NOW())`,
            ];
            for (const it of items) {
                const pid = num(it.product_id);
                const qty = num(it.quantity);
                if (!pid || qty <= 0) continue;
                const unitCost = priceMap.get(pid) ?? 0;
                qs.push(
                    txn`INSERT INTO store_transfer_items (transfer_id, product_id, quantity, unit_cost, line_total)
                        SELECT t.id, ${pid}, ${qty}, ${unitCost}, ${unitCost * qty}
                        FROM store_transfers t WHERE t.reference = ${reference}`,
                );
            }
            return qs;
        });

        const created = await sql`SELECT * FROM store_transfers WHERE reference = ${reference}`;
        return NextResponse.json({ success: true, data: created[0] }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to create transfer' }, { status: 500 });
    }
}

async function complete(userId: number, transferId: number) {
    const rows = await sql`SELECT * FROM store_transfers WHERE id = ${transferId}`;
    if (rows.length === 0) return NextResponse.json({ success: false, error: 'Transfer not found' }, { status: 404 });
    if (rows[0].status !== 'pending') {
        return NextResponse.json({ success: false, error: 'Only pending transfers can be completed' }, { status: 400 });
    }

    const items = await sql`SELECT * FROM store_transfer_items WHERE transfer_id = ${transferId}`;

    await transaction((txn: any) => {
        const qs: any[] = [
            txn`UPDATE store_transfers SET status = 'completed', completed_at = NOW() WHERE id = ${transferId}`,
        ];
        for (const it of items) {
            qs.push(
                txn`UPDATE products SET stock_quantity = stock_quantity - ${it.quantity}, updated_at = NOW() WHERE id = ${it.product_id}`,
                txn`INSERT INTO stock_movements (product_id, movement_type, quantity, reference, notes, created_by, created_at)
                    VALUES (${it.product_id}, 'out', ${it.quantity}, ${rows[0].reference}, 'Store transfer', ${userId}, NOW())`,
            );
        }
        return qs;
    });

    return NextResponse.json({ success: true });
}