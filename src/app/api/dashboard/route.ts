import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requirePermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const { error } = await requirePermission('dashboard');
    if (error) return error;

    try {
        const [todayOrders, todaySales, monthSales, yesterdaySales, productStats, recent, recentLow] =
            await Promise.all([
                sql`SELECT count(*)::int AS n FROM orders WHERE created_at::date = CURRENT_DATE AND status = 'completed'`,
                sql`SELECT COALESCE(SUM(total), 0)::float AS total FROM orders WHERE created_at::date = CURRENT_DATE AND status = 'completed'`,
                sql`SELECT COALESCE(SUM(total), 0)::float AS total FROM orders WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE) AND status = 'completed'`,
                sql`SELECT COALESCE(SUM(total), 0)::float AS total FROM orders WHERE created_at::date = CURRENT_DATE - 1 AND status = 'completed'`,
                sql`SELECT
                        (SELECT count(*)::int FROM products WHERE is_active = TRUE) AS active_products,
                        (SELECT count(*)::int FROM products WHERE is_active = TRUE AND stock_quantity <= min_stock) AS low_stock_count`,
                sql`SELECT o.id, o.order_number, o.total, o.payment_method, o.status, o.created_at,
                           u.full_name AS user_name
                    FROM orders o LEFT JOIN users u ON o.user_id = u.id
                    ORDER BY o.created_at DESC LIMIT 10`,
                sql`SELECT id, name, stock_quantity, min_stock, selling_price FROM products
                    WHERE is_active = TRUE AND stock_quantity <= min_stock
                    ORDER BY stock_quantity ASC LIMIT 10`,
            ]);

        return NextResponse.json({
            success: true,
            data: {
                today_orders: todayOrders[0].n,
                today_sales: todaySales[0].total,
                month_sales: monthSales[0].total,
                yesterday_sales: yesterdaySales[0].total,
                active_products: productStats[0].active_products,
                low_stock_count: productStats[0].low_stock_count,
                recent_orders: recent,
                low_stock_products: recentLow,
            },
        });
    } catch (e) {
        console.error('Dashboard error:', e);
        return NextResponse.json({ success: false, error: 'Failed to load dashboard' }, { status: 500 });
    }
}