'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/use-auth';
import { Button, Select, Input, Modal, Table, Loader, PageHeader, Toolbar, Badge, statusTone } from '@/components/ui';
import { money, num, dateTime } from '@/lib/format';

interface OrderItem { id: number; product_id: number; product_name: string; quantity: number; unit_price: number; subtotal: number; }
interface Order {
    id: number; order_number: string; invoice_number: string | null; fs_number: string | null;
    customer_name: string; subtotal: number; tax_amount: number; discount: number; total: number;
    amount_paid: number; change_amount: number; payment_method: string; status: string;
    user_name: string | null; store_name: string | null; created_at: string;
    items?: OrderItem[];
}

export default function OrdersPage() {
    const { loading: authLoading } = useAuth();
    const [rows, setRows] = useState<Order[]>([]);
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [detail, setDetail] = useState<Order | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (status) params.set('status', status);
        params.set('limit', '50');
        setRows(await api.get<Order[]>(`/api/orders?${params}`));
    }, [q, status]);

    useEffect(() => {
        if (authLoading) return;
        const t = setTimeout(() => load().catch(() => {}), 250);
        return () => clearTimeout(t);
    }, [authLoading, load]);

    async function openDetail(o: Order) {
        setDetail(await api.get<Order>(`/api/orders?id=${o.id}`));
    }

    async function refund(o: Order) {
        if (!confirm(`Refund order ${o.order_number} for ${money(o.total)}?`)) return;
        setBusy(true);
        try {
            await api.post('/api/orders', { action: 'refund', order_id: o.id });
            setDetail(null);
            load();
        } finally {
            setBusy(false);
        }
    }

    if (authLoading) return <Loader />;

    return (
        <div>
            <PageHeader title="Orders" description="Sales history and refunds" />
            <Toolbar>
                <Input className="max-w-xs" placeholder="Search order / invoice / customer..." value={q} onChange={(e) => setQ(e.target.value)} />
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All statuses</option>
                    <option value="completed">Completed</option>
                    <option value="refunded">Refunded</option>
                </Select>
            </Toolbar>
            <Table
                rowKey={(r) => r.id}
                rows={rows}
                columns={[
                    { key: 'order_number', label: 'Order', render: (r) => (
                        <button className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50" onClick={() => openDetail(r)}>{r.order_number}</button>
                    ) },
                    { key: 'invoice_number', label: 'Invoice', render: (r) => r.invoice_number || '-' },
                    { key: 'customer_name', label: 'Customer', render: (r) => r.customer_name },
                    { key: 'user_name', label: 'User', render: (r) => r.user_name || '-' },
                    { key: 'total', label: 'Total', render: (r) => money(r.total) },
                    { key: 'payment_method', label: 'Payment', render: (r) => <span className="capitalize">{r.payment_method}</span> },
                    { key: 'status', label: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
                    { key: 'created_at', label: 'When', render: (r) => dateTime(r.created_at) },
                ]}
            />

            <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Order ${detail.order_number}` : ''} wide footer={
                detail && detail.status === 'completed' ? (
                    <>
                        <Button variant="secondary" onClick={() => window.print()}>Print</Button>
                        <Button variant="danger" loading={busy} onClick={() => refund(detail)}>Refund</Button>
                    </>
                ) : undefined
            }>
                {detail && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                            <p className="text-zinc-500">Invoice: <span className="font-medium text-zinc-900 dark:text-zinc-50">{detail.invoice_number || '-'}</span></p>
                            <p className="text-zinc-500">FS: <span className="font-medium text-zinc-900 dark:text-zinc-50">{detail.fs_number || '-'}</span></p>
                            <p className="text-zinc-500">Customer: <span className="font-medium text-zinc-900 dark:text-zinc-50">{detail.customer_name}</span></p>
                            <p className="text-zinc-500">User: <span className="font-medium text-zinc-900 dark:text-zinc-50">{detail.user_name || '-'}</span></p>
                            <p className="text-zinc-500">Date: <span className="font-medium text-zinc-900 dark:text-zinc-50">{dateTime(detail.created_at)}</span></p>
                            <p className="text-zinc-500">Payment: <span className="font-medium capitalize text-zinc-900 dark:text-zinc-50">{detail.payment_method}</span></p>
                        </div>
                        <Table
                            rowKey={(i) => i.id}
                            rows={detail.items || []}
                            columns={[
                                { key: 'product_name', label: 'Item' },
                                { key: 'quantity', label: 'Qty' },
                                { key: 'unit_price', label: 'Unit', render: (i) => money(i.unit_price) },
                                { key: 'subtotal', label: 'Subtotal', render: (i) => money(i.subtotal) },
                            ]}
                        />
                        <div className="space-y-1 border-t border-zinc-200 pt-3 text-sm dark:border-zinc-700">
                            <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span>{money(detail.subtotal)}</span></div>
                            <div className="flex justify-between text-zinc-500"><span>Tax</span><span>{money(detail.tax_amount)}</span></div>
                            <div className="flex justify-between text-zinc-500"><span>Discount</span><span>-{money(detail.discount)}</span></div>
                            <div className="flex justify-between text-base font-bold text-zinc-900 dark:text-zinc-50"><span>Total</span><span>{money(detail.total)}</span></div>
                            <div className="flex justify-between text-zinc-500"><span>Paid</span><span>{money(detail.amount_paid)}</span></div>
                            {num(detail.change_amount) > 0 && <div className="flex justify-between text-zinc-500"><span>Change</span><span>{money(detail.change_amount)}</span></div>}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}