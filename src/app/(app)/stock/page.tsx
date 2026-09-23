'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/use-auth';
import { Button, Input, Modal, Select, Field, Table, Loader, PageHeader, Toolbar, Badge, statusTone } from '@/components/ui';
import { money, num, dateTime } from '@/lib/format';

interface StockRow { id: number; name: string; barcode: string | null; category_name: string | null; stock_quantity: number; min_stock: number; cost_price: number; selling_price: number; is_low_stock: boolean; }
interface Movement { id: number; product_name: string | null; movement_type: string; quantity: number; reference: string | null; notes: string | null; created_by_name: string | null; created_at: string; }

export default function StockPage() {
    const { loading: authLoading } = useAuth();
    const [view, setView] = useState<'levels' | 'movements'>('levels');
    const [rows, setRows] = useState<StockRow[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [lowOnly, setLowOnly] = useState(false);
    const [products, setProducts] = useState<Array<{ id: number; name: string }>>([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ product_id: '', movement_type: 'adjustment', quantity: '0', notes: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadLevels = useCallback(async () => {
        setRows(await api.get<StockRow[]>('/api/stock?view=list' + (lowOnly ? '&low_stock=true' : '')));
    }, [lowOnly]);

    const loadMovements = useCallback(async () => {
        setMovements(await api.get<Movement[]>('/api/stock?view=movements'));
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (view === 'levels') loadLevels().catch(() => {});
        else loadMovements().catch(() => {});
        api.get<Array<{ id: number; name: string }>>('/api/products?limit=500').then(setProducts).catch(() => {});
    }, [authLoading, view, loadLevels, loadMovements]);

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError(null);
        try {
            await api.post('/api/stock', {
                product_id: Number(form.product_id),
                movement_type: form.movement_type,
                quantity: form.movement_type === 'adjustment' ? num(form.quantity) : num(form.quantity),
                notes: form.notes,
            });
            setOpen(false);
            setForm({ product_id: '', movement_type: 'adjustment', quantity: '0', notes: '' });
            loadLevels();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    if (authLoading) return <Loader />;

    return (
        <div>
            <PageHeader title="Stock" description="Inventory levels and movements" actions={<Button onClick={() => setOpen(true)}>Adjust Stock</Button>} />
            <Toolbar>
                <Select value={view} onChange={(e) => setView(e.target.value as any)}>
                    <option value="levels">Stock Levels</option>
                    <option value="movements">Movements</option>
                </Select>
                {view === 'levels' && (
                    <Button variant="secondary" onClick={() => setLowOnly((v) => !v)}>
                        {lowOnly ? 'All items' : 'Low stock only'}
                    </Button>
                )}
            </Toolbar>

            {view === 'levels' ? (
                <Table
                    rowKey={(r) => r.id}
                    rows={rows}
                    columns={[
                        { key: 'name', label: 'Product', render: (r) => <span className="font-medium">{r.name}</span> },
                        { key: 'barcode', label: 'Barcode', render: (r) => r.barcode || '-' },
                        { key: 'category_name', label: 'Category', render: (r) => r.category_name || '-' },
                        { key: 'stock_quantity', label: 'In Stock', render: (r) => <span className={num(r.stock_quantity) <= num(r.min_stock) ? 'font-semibold text-red-600' : ''}>{r.stock_quantity}</span> },
                        { key: 'min_stock', label: 'Min' },
                        { key: 'cost_price', label: 'Cost', render: (r) => money(r.cost_price) },
                        { key: 'selling_price', label: 'Price', render: (r) => money(r.selling_price) },
                        { key: 'is_low_stock', label: 'Status', render: (r) => <Badge tone={r.is_low_stock ? 'red' : 'green'}>{r.is_low_stock ? 'Low' : 'Ok'}</Badge> },
                    ]}
                />
            ) : (
                <Table
                    rowKey={(r) => r.id}
                    rows={movements}
                    columns={[
                        { key: 'product_name', label: 'Product', render: (r) => r.product_name || `#${(r as any).product_id}` },
                        { key: 'movement_type', label: 'Type', render: (r) => <Badge tone={statusTone(r.movement_type)}>{r.movement_type}</Badge> },
                        { key: 'quantity', label: 'Qty' },
                        { key: 'reference', label: 'Reference', render: (r) => r.reference || '-' },
                        { key: 'notes', label: 'Notes', render: (r) => r.notes || '-' },
                        { key: 'created_by_name', label: 'By', render: (r) => r.created_by_name || '-' },
                        { key: 'created_at', label: 'When', render: (r) => dateTime(r.created_at) },
                    ]}
                />
            )}

            <Modal open={open} onClose={() => setOpen(false)} title="Adjust Stock" footer={
                <>
                    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={save} loading={saving}>Save</Button>
                </>
            }>
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <form onSubmit={save} className="space-y-4">
                    <Field label="Product">
                        <Select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                            <option value="">Select product...</option>
                            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Type">
                        <Select value={form.movement_type} onChange={(e) => setForm({ ...form, movement_type: e.target.value })}>
                            <option value="adjustment">Adjustment (set to)</option>
                            <option value="in">Stock In (add)</option>
                            <option value="out">Stock Out (remove)</option>
                        </Select>
                    </Field>
                    <Field label={form.movement_type === 'adjustment' ? 'New Quantity' : 'Quantity'}>
                        <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                    </Field>
                    <Field label="Notes"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
                </form>
            </Modal>
        </div>
    );
}