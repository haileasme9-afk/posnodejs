'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/use-auth';
import { Card, Select, Loader, PageHeader, Toolbar, Table, StatCard, EmptyState } from '@/components/ui';
import { money, dateOnly } from '@/lib/format';

interface ReportData {
    summary: { total_sales: number; total_refunds: number; total_tax: number; total_discount: number; order_count: number; refund_count: number; avg_order: number };
    top_products: Array<{ id: number; name: string; qty_sold: number; revenue: number }>;
    sales_by_day: Array<{ day: string; total: number; orders: number }>;
    by_payment: Array<{ method: string; total: number; orders: number }>;
    movements: Array<{ movement_type: string; count: number; quantity: number }>;
}

export default function ReportsPage() {
    const { loading: authLoading } = useAuth();
    const [range, setRange] = useState('month');
    const [data, setData] = useState<ReportData | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const load = useCallback(async () => {
        setData(await api.get<ReportData>(`/api/reports?range=${range}`));
    }, [range]);

    useEffect(() => {
        if (authLoading) return;
        load().catch((e) => setErr(e.message));
    }, [authLoading, load]);

    if (authLoading) return <Loader />;

    const s = data?.summary;

    return (
        <div>
            <PageHeader title="Reports" description="Sales and stock analytics" />
            <Toolbar>
                <Select value={range} onChange={(e) => setRange(e.target.value)}>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="month">This month</option>
                </Select>
            </Toolbar>
            {err && <p className="mb-4 text-sm text-red-600">{err}</p>}

            {data && (
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Total Sales" value={money(s?.total_sales)} tone="green" />
                        <StatCard label="Orders" value={s?.order_count} />
                        <StatCard label="Tax Collected" value={money(s?.total_tax)} />
                        <StatCard label="Refunds" value={money(s?.total_refunds)} />
                        <StatCard label="Discounts Given" value={money(s?.total_discount)} />
                        <StatCard label="Avg Order Value" value={money(s?.avg_order)} />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card title="Top Products">
                            {data.top_products.length === 0 ? <EmptyState message="No sales in this period." /> : (
                                <Table rowKey={(r) => r.id} rows={data.top_products} columns={[
                                    { key: 'name', label: 'Product', render: (r) => <span className="font-medium">{r.name}</span> },
                                    { key: 'qty_sold', label: 'Qty' },
                                    { key: 'revenue', label: 'Revenue', render: (r) => money(r.revenue) },
                                ]} />
                            )}
                        </Card>
                        <Card title="Payment Methods">
                            {data.by_payment.length === 0 ? <EmptyState message="No sales in this period." /> : (
                                <Table rowKey={(r) => r.method} rows={data.by_payment} columns={[
                                    { key: 'method', label: 'Method', render: (r) => <span className="capitalize">{r.method}</span> },
                                    { key: 'orders', label: 'Orders' },
                                    { key: 'total', label: 'Total', render: (r) => money(r.total) },
                                ]} />
                            )}
                        </Card>
                    </div>

                    <Card title="Sales by Day">
                        {data.sales_by_day.length === 0 ? <EmptyState message="No sales in this period." /> : (
                            <Table rowKey={(r) => r.day} rows={data.sales_by_day} columns={[
                                { key: 'day', label: 'Date', render: (r) => dateOnly(`${r.day}T00:00:00`) },
                                { key: 'orders', label: 'Orders' },
                                { key: 'total', label: 'Total', render: (r) => money(r.total) },
                            ]} />
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}