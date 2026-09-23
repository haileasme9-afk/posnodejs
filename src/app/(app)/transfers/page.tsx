'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/use-auth';
import { Button, Input, Select, Modal, Field, Table, Loader, PageHeader, Badge, statusTone } from '@/components/ui';
import { money, dateTime } from '@/lib/format';

interface Store { id: number; name: string; }
interface Transfer { id: number; reference: string; from_store_name: string | null; to_store_name: string | null; status: string; total_items: number; total_value: number; notes: string | null; created_at: string; items?: any[]; }

export default function TransfersPage() {
    const { loading: authLoading } = useAuth();
    const [rows, setRows] = useState<Transfer[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [products, setProducts] = useState<Array<{ id: number; name: string }>>([]);
    const [open, setOpen] = useState(false);
    const [fromId, setFromId] = useState('');
    const [toId, setToId] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<Array<{ product_id: string; quantity: string }>>([{ product_id: '', quantity: '1' }]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detail, setDetail] = useState<Transfer | null>(null);

    const load = useCallback(async () => {
        setRows(await api.get<Transfer[]>('/api/transfers'));
    }, []);

    useEffect(() => {
        if (authLoading) return;
        load().catch(() => {});
        api.get<Store[]>('/api/stores').then(setStores).catch(() => {});
        api.get<Array<{ id: number; name: string }>>('/api/products?limit=500').then(setProducts).catch(() => {});
    }, [authLoading, load]);

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError(null);
        const items = lines.filter((l) => l.product_id).map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity) }));
        if (items.length === 0) { setError('Add at least one item'); setSaving(false); return; }
        try {
            await api.post('/api/transfers', { from_store_id: Number(fromId), to_store_id: Number(toId), items, notes });
            setOpen(false);
            setLines([{ product_id: '', quantity: '1' }]); setFromId(''); setToId(''); setNotes('');
            load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function act(action: string, t: Transfer) {
        if (action === 'complete' && !confirm(`Complete transfer ${t.reference}? Stock will be deducted.`)) return;
        if (action === 'cancel' && !confirm(`Cancel transfer ${t.reference}?`)) return;
        if (action === 'delete' && !confirm(`Delete transfer ${t.reference}?`)) return;
        await api.post('/api/transfers', { action, transfer_id: t.id });
        setDetail(null);
        load();
    }

    if (authLoading) return <Loader />;

    return (
        <div>
            <PageHeader title="Store Transfers" description="Move stock between stores" actions={<Button onClick={() => setOpen(true)}>New Transfer</Button>} />
            <Table
                rowKey={(r) => r.id}
                rows={rows}
                columns={[
                    { key: 'reference', label: 'Reference', render: (r) => (
                        <button className="font-medium underline-offset-2 hover:underline" onClick={() => { api.get(`/api/transfers?id=${r.id}`).then(setDetail); }}>{r.reference}</button>
                    ) },
                    { key: 'from_store_name', label: 'From', render: (r) => r.from_store_name || '-' },
                    { key: 'to_store_name', label: 'To', render: (r) => r.to_store_name || '-' },
                    { key: 'total_items', label: 'Items' },
                    { key: 'total_value', label: 'Value', render: (r) => money(r.total_value) },
                    { key: 'status', label: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
                    { key: 'created_at', label: 'Date', render: (r) => dateTime(r.created_at) },
                ]}
            />

            <Modal open={open} onClose={() => setOpen(false)} title="New Store Transfer" wide footer={
                <>
                    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={save} loading={saving}>Create Transfer</Button>
                </>
            }>
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <form onSubmit={save} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="From Store">
                            <Select value={fromId} onChange={(e) => setFromId(e.target.value)}>
                                <option value="">Select...</option>
                                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                        </Field>
                        <Field label="To Store">
                            <Select value={toId} onChange={(e) => setToId(e.target.value)}>
                                <option value="">Select...</option>
                                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                        </Field>
                        <div className="col-span-2"><Field label="Notes"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field></div>
                    </div>
                    <div className="space-y-2">
                        {lines.map((l, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_90px_auto] items-center gap-2">
                                <Select value={l.product_id} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, product_id: e.target.value } : x)))}>
                                    <option value="">Select product...</option>
                                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Select>
                                <Input type="number" min="1" placeholder="Qty" value={l.quantity} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, quantity: e.target.value } : x)))} />
                                <Button variant="ghost" type="button" onClick={() => setLines((p) => p.filter((_, i) => i !== idx))} className="px-2">✕</Button>
                            </div>
                        ))}
                        <Button variant="secondary" type="button" onClick={() => setLines((p) => [...p, { product_id: '', quantity: '1' }])}>+ Add Item</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Transfer ${detail.reference}` : ''} wide footer={
                detail ? (
                    <>
                        <Button variant="secondary" onClick={() => window.print()}>Print</Button>
                        {detail.status === 'pending' && (
                            <>
                                <Button variant="success" onClick={() => act('complete', detail)}>Complete</Button>
                                <Button variant="secondary" onClick={() => act('cancel', detail)}>Cancel</Button>
                                <Button variant="danger" onClick={() => act('delete', detail)}>Delete</Button>
                            </>
                        )}
                    </>
                ) : undefined
            }>
                {detail && (
                    <div className="space-y-3 text-sm">
                        <p>{detail.from_store_name || '-'} → {detail.to_store_name || '-'} · <Badge tone={statusTone(detail.status)}>{detail.status}</Badge></p>
                        <Table rowKey={(i) => i.id} rows={detail.items || []} columns={[
                            { key: 'product_name', label: 'Item' },
                            { key: 'quantity', label: 'Qty' },
                            { key: 'unit_cost', label: 'Unit Cost', render: (i: any) => money(i.unit_cost) },
                        ]} />
                    </div>
                )}
            </Modal>
        </div>
    );
}