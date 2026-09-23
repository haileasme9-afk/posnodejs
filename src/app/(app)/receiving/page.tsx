'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/use-auth';
import { Button, Input, Select, Modal, Field, Table, Loader, PageHeader } from '@/components/ui';
import { money, num, dateTime } from '@/lib/format';

interface Supplier { id: number; name: string; }
interface Receiving { id: number; reference: string; supplier_name: string | null; store_name: string | null; total_cost: number; item_count: number; created_at: string; user_name?: string; }

export default function ReceivingPage() {
    const { loading: authLoading } = useAuth();
    const [rows, setRows] = useState<Receiving[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Array<{ id: number; name: string; stock_quantity: number }>>([]);
    const [open, setOpen] = useState(false);
    const [supplierId, setSupplierId] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<Array<{ product_id: string; quantity: string; unit_cost: string }>>([{ product_id: '', quantity: '1', unit_cost: '0' }]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detail, setDetail] = useState<Receiving & { items?: any[] } | null>(null);

    const load = useCallback(async () => {
        setRows(await api.get<Receiving[]>('/api/receiving'));
    }, []);

    useEffect(() => {
        if (authLoading) return;
        load().catch(() => {});
        api.get<Supplier[]>('/api/suppliers').then(setSuppliers).catch(() => {});
        api.get<Array<{ id: number; name: string; stock_quantity: number }>>('/api/products?limit=500').then(setProducts).catch(() => {});
    }, [authLoading, load]);

    function addLine() {
        setLines((prev) => [...prev, { product_id: '', quantity: '1', unit_cost: '0' }]);
    }
    function updateLine(idx: number, key: string, value: string) {
        setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
    }

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError(null);
        const items = lines
            .filter((l) => l.product_id)
            .map((l) => ({ product_id: Number(l.product_id), quantity: num(l.quantity), unit_cost: num(l.unit_cost) }));
        if (items.length === 0) {
            setError('Add at least one item'); setSaving(false); return;
        }
        try {
            await api.post('/api/receiving', { supplier_id: supplierId ? Number(supplierId) : null, items, notes });
            setOpen(false);
            setLines([{ product_id: '', quantity: '1', unit_cost: '0' }]);
            setSupplierId(''); setNotes('');
            load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    if (authLoading) return <Loader />;

    return (
        <div>
            <PageHeader title="Stock Receiving" description="Record incoming stock (GRN)" actions={<Button onClick={() => setOpen(true)}>New Receiving</Button>} />
            <Table
                rowKey={(r) => r.id}
                rows={rows}
                columns={[
                    { key: 'reference', label: 'Reference', render: (r) => (
                        <button className="font-medium underline-offset-2 hover:underline" onClick={() => { setDetail(r); }}>{r.reference}</button>
                    ) },
                    { key: 'supplier_name', label: 'Supplier', render: (r) => r.supplier_name || '-' },
                    { key: 'item_count', label: 'Items' },
                    { key: 'total_cost', label: 'Total Cost', render: (r) => money(r.total_cost) },
                    { key: 'created_at', label: 'Date', render: (r) => dateTime(r.created_at) },
                ]}
            />

            <Modal open={open} onClose={() => setOpen(false)} title="New Stock Receiving" wide footer={
                <>
                    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={save} loading={saving}>Save Receiving</Button>
                </>
            }>
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <form onSubmit={save} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Supplier">
                            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                                <option value="">None</option>
                                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                        </Field>
                        <Field label="Notes"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
                    </div>
                    <div className="space-y-2">
                        {lines.map((l, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_90px_110px_auto] items-center gap-2">
                                <Select value={l.product_id} onChange={(e) => updateLine(idx, 'product_id', e.target.value)}>
                                    <option value="">Select product...</option>
                                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock_quantity} in stock)</option>)}
                                </Select>
                                <Input type="number" min="1" placeholder="Qty" value={l.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} />
                                <Input type="number" step="0.01" placeholder="Unit cost" value={l.unit_cost} onChange={(e) => updateLine(idx, 'unit_cost', e.target.value)} />
                                <Button variant="ghost" type="button" onClick={() => setLines((p) => p.filter((_, i) => i !== idx))} className="px-2">✕</Button>
                            </div>
                        ))}
                        <Button variant="secondary" type="button" onClick={addLine}>+ Add Item</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Receiving ${detail.reference}` : ''}>
                {detail && (
                    <div className="space-y-3 text-sm">
                        <p>Supplier: <span className="font-medium">{detail.supplier_name || '-'}</span></p>
                        <p>Date: <span className="font-medium">{dateTime(detail.created_at)}</span></p>
                        <Table
                            rowKey={(i) => i.id}
                            rows={detail.items || []}
                            columns={[
                                { key: 'product_name', label: 'Item' },
                                { key: 'quantity', label: 'Qty' },
                                { key: 'unit_cost', label: 'Unit Cost', render: (i: any) => money(i.unit_cost) },
                            ]}
                        />
                        <p className="text-right font-bold">Total: {money(detail.total_cost)}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
}