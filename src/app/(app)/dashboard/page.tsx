'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/components/use-auth';
import { Card, Loader, PageHeader, StatCard, Table, Badge, statusTone, Button, EmptyState } from '@/components/ui';
import { money, dateTime } from '@/lib/format';

interface Dash {
    today_orders: number;
    today_sales: number;
    month_sales: number;
    yesterday_sales: number;
    active_products: number;
    low_stock_count: number;
    recent_orders: Array<{ id: number; order_number: string; total: number; payment_method: string; status: string; created_at: string; user_name: string | null }>;
    low_stock_products: Array<{ id: number; name: string; stock_quantity: number; min_stock: number; selling_price: number }>;
}

export default function DashboardPage() {
    const router = useRouter();
    const { loading: authLoading } = useAuth();
    const [data, setData] = useState<Dash | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        api.get<Dash>('/api/dashboard').then(setData).catch((e) => setErr(e.message));
    }, []);

    if (authLoading || (!data && !err)) return <Loader />;

    return (
        <div>
            <PageHeader title="Dashboard" description="Business overview" />
            {err && <p className="mb-4 text-sm text-red-600">{err}</p>}
            {data && (
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Today's Sales" value={money(data.today_sales)} tone="green" />
                        <StatCard label="Today's Orders" value={data.today_orders} />
                        <StatCard label="This Month" value={money(data.month_sales)} />
                        <StatCard label="Yesterday" value={money(data.yesterday_sales)} />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card title="Recent Orders" actions={<Link href="/orders" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">View all</Link>}>
                            {data.recent_orders.length === 0 ? (
                                <EmptyState message="No orders yet. Start selling from the POS." />
                            ) : (
                                <Table
                                    rowKey={(r) => r.id}
                                    rows={data.recent_orders}
                                    columns={[
                                        { key: 'order_number', label: 'Order' },
                                        { key: 'user_name', label: 'User', render: (r) => r.user_name || '-' },
                                        { key: 'total', label: 'Total', render: (r) => money(r.total) },
                                        { key: 'status', label: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
                                        { key: 'created_at', label: 'When', render: (r) => dateTime(r.created_at) },
                                    ]}
                                />
                            )}
                        </Card>

                        <Card title="Low Stock Alerts" actions={<Link href="/stock" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Go to stock</Link>}>
                            {data.low_stock_products.length === 0 ? (
                                <EmptyState message="All stock levels are healthy." />
                            ) : (
                                <Table
                                    rowKey={(r) => r.id}
                                    rows={data.low_stock_products}
                                    columns={[
                                        { key: 'name', label: 'Product' },
                                        { key: 'stock_quantity', label: 'In Stock', render: (r) => <span className="font-medium text-red-600">{r.stock_quantity}</span> },
                                        { key: 'min_stock', label: 'Min', render: (r) => r.min_stock },
                                        { key: 'selling_price', label: 'Price', render: (r) => money(r.selling_price) },
                                    ]}
                                />
                            )}
                        </Card>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{data.active_products}</p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Active Products</p>
                        </Card>
                        <Card>
                            <p className="text-3xl font-bold text-red-600">{data.low_stock_count}</p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Low Stock Items</p>
                        </Card>
                    </div>

                    <div>
                        <Button onClick={() => router.push('/pos')} className="w-full sm:w-auto">
                            Open POS Terminal
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}