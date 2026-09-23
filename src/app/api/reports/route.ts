import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requirePermission } from '@/lib/auth';
import { num } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { error } = await requirePermission('reports');
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    try {
        let start: string;
        if (from) {
            start = `'${from}'`;
        } else if (range === 'today') {
            start = `CURRENT_DATE`;
        } else if (range === '7d') {
            start = `CURRENT_DATE - INTERVAL '7 days'`;
        } else if (range === '30d') {
            start = `CURRENT_DATE - INTERVAL '30 days'`;
        } else if (range === 'yesterday') {
            start = `CURRENT_DATE - INTERVAL '1 day'`;
        } else {
            start = `date_trunc('month', CURRENT_DATE)`;
        }
        const end = to ? `'${to}' + INTERVAL '1 day'` : `NOW()`;
        const cond = `o.created_at >= ${start} AND o.created_at < ${end}`;

        const [summary, topProducts, salesByDay, byPayment, movements] = await Promise.all([
            sql(`SELECT
                COALESCE(SUM(CASE WHEN status = 'completed' THEN total END), 0) AS total_sales,
                COALESCE(SUM(CASE WHEN status = 'refunded' THEN total END), 0) AS total_refunds,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN tax_amount END), 0) AS total_tax,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN discount END), 0) AS total_discount,
                COUNT(*) FILTER (WHERE status = 'completed') AS order_count,
                COUNT(*) FILTER (WHERE status = 'refunded') AS refund_count,
                COALESCE(AVG(total) FILTER (WHERE status = 'completed'), 0) AS avg_order
                FROM orders o WHERE ${cond}`),
            sql(`SELECT p.id, p.name, SUM(oi.quantity) AS qty_sold, SUM(oi.quantity * oi.unit_price) AS revenue
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
                JOIN products p ON oi.product_id = p.id
                WHERE ${cond.replace('o.created_at', 'o.created_at')}
                GROUP BY p.id, p.name
                ORDER BY qty_sold DESC LIMIT 10`),
            sql(`SELECT DATE(o.created_at) AS day, SUM(o.total) AS total, COUNT(*) AS orders
                FROM orders o WHERE o.status = 'completed' AND ${cond.replace('o.created_at', 'o.created_at')}
                GROUP BY DATE(o.created_at) ORDER BY day DESC LIMIT 31`),
            sql(`SELECT COALESCE(payment_method, 'cash') AS method, SUM(total) AS total, COUNT(*) AS orders
                FROM orders o WHERE o.status = 'completed' AND ${cond.replace('o.created_at', 'o.created_at')}
                GROUP BY payment_method ORDER BY total DESC`),
            sql(`SELECT movement_type, COUNT(*) AS count, SUM(quantity) AS quantity
                FROM stock_movements m WHERE m.created_at >= ${start} AND m.created_at < ${end}
                GROUP BY movement_type`),
        ]);

        const data = {
            range,
            start,
            summary: { ...summary[0], total_sales: num(summary[0].total_sales) },
            top_products: topProducts.slice(0, 10).map((r: any) => ({ ...r, qty_sold: num(r.qty_sold), revenue: num(r.revenue) })),
            sales_by_day: salesByDay.map((r: any) => ({ ...r, total: num(r.total) })),
            by_payment: byPayment.map((r: any) => ({ ...r, total: num(r.total) })),
            movements: movements,
        };
        return NextResponse.json({ success: true, data });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, error: 'Failed to load reports' }, { status: 500 });
    }
}