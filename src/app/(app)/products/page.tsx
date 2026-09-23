'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/use-auth';
import { Button, Input, Modal, Select, Field, Table, Loader, Badge, PageHeader, Toolbar } from '@/components/ui';
import { money, num } from '@/lib/format';

interface Product {
    id: number;
    name: string;
    barcode: string | null;
    item_code: string | null;
    category_id: number | null;
    category_name: string | null;
    supplier_id: number | null;
    supplier_name: string | null;
    cost_price: number;
    selling_price: number;
    stock_quantity: number;
    min_stock: number;
    unit: string;
    is_active: boolean;
}

export default function ProductsPage() {
    const { loading: authLoading } = useAuth();
    const [rows, setRows] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
    const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '', barcode: '', item_code: '', category_id: '', supplier_id: '',
        cost_price: '0', selling_price: '0', stock_quantity: '0', min_stock: '5', unit: 'pcs',
    });

    const load = useCallback(async () => {
        const data = await api.get<Product[]>('/api/products?limit=200' + (q ? `&q=${encodeURIComponent(q)}` : ''));
        setRows(data);
    }, [q]);

    useEffect(() => {
        if (authLoading) return;
        const t = setTimeout(() => load().catch(() => {}), 250);
        api.get<Array<{ id: number; name: string }>>('/api/categories').then(setCategories).catch(() => {});
        api.get<Array<{ id: number; name: string }>>('/api/suppliers').then(setSuppliers).catch(() => {});
        return () => clearTimeout(t);
    }, [authLoading, load]);

    function openCreate() {
        setEditing(null);
        setForm({ name: '', barcode: '', item_code: '', category_id: '', supplier_id: '', cost_price: '0', selling_price: '0', stock_quantity: '0', min_stock: '5', unit: 'pcs' });
        setOpen(true);
    }

    function openEdit(p: Product) {
        setEditing(p);
        setForm({
            name: p.name, barcode: p.barcode || '', item_code: p.item_code || '',
            category_id: p.category_id ? String(p.category_id) : '', supplier_id: p.supplier_id ? String(p.supplier_id) : '',
            cost_price: String(num(p.cost_price)), selling_price: String(num(p.selling_price)),
            stock_quantity: String(num(p.stock_quantity)), min_stock: String(num(p.min_stock)), unit: p.unit,
        });
        setOpen(true);
    }

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const payload = {
            name: form.name,
            barcode: form.barcode || null,
            item_code: form.item_code || null,
            category_id: form.category_id ? Number(form.category_id) : null,
            supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
            cost_price: num(form.cost_price),
            selling_price: num(form.selling_price),
            stock_quantity: num(form.stock_quantity),
            min_stock: num(form.min_stock),
            unit: form.unit,
        };
        try {
            if (editing) {
                await api.put(`/api/products?id=${editing.id}`, payload);
            } else {
                await api.post('/api/products', payload);
            }
            setOpen(false);
            load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function remove(p: Product) {
        if (!confirm(`Delete product "${p.name}"?`)) return;
        await api.del(`/api/products?id=${p.id}`);
        load();
    }

    if (authLoading) return <Loader />;

    return (
        <div>
            <PageHeader title="Products" description="Manage your product catalog" actions={<Button onClick={openCreate}>Add Product</Button>} />
            <Toolbar>
                <Input className="max-w-xs" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
            </Toolbar>
            <Table
                rowKey={(r) => r.id}
                rows={rows}
                columns={[
                    { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
                    { key: 'barcode', label: 'Barcode', render: (r) => r.barcode || '-' },
                    { key: 'category_name', label: 'Category', render: (r) => r.category_name || '-' },
                    { key: 'cost_price', label: 'Cost', render: (r) => money(r.cost_price) },
                    { key: 'selling_price', label: 'Price', render: (r) => money(r.selling_price) },
                    { key: 'stock_quantity', label: 'Stock', render: (r) => (
                        <span className={num(r.stock_quantity) <= num(r.min_stock) ? 'font-medium text-red-600' : ''}>{r.stock_quantity}</span>
                    ) },
                    { key: 'is_active', label: 'Status', render: (r) => <Badge tone={r.is_active ? 'green' : 'zinc'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
                    { key: 'actions', label: '', render: (r) => (
                        <div className="flex gap-2">
                            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => openEdit(r)}>Edit</Button>
                            <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => remove(r)}>Delete</Button>
                        </div>
                    ) },
                ]}
            />

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Product' : 'Add Product'} footer={
                <>
                    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Add Product'}</Button>
                </>
            }>
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <form onSubmit={save} className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Field label="Product Name"><Input value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                    </div>
                    <Field label="Barcode"><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></Field>
                    <Field label="Item Code"><Input value={form.item_code} onChange={(e) => setForm({ ...form, item_code: e.target.value })} /></Field>
                    <Field label="Category">
                        <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                            <option value="">None</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Supplier">
                        <Select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
                            <option value="">None</option>
                            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Cost Price"><Input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} /></Field>
                    <Field label="Selling Price"><Input type="number" step="0.01" value={form.selling_price} required onChange={(e) => setForm({ ...form, selling_price: e.target.value })} /></Field>
                    <Field label="Stock Quantity"><Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} /></Field>
                    <Field label="Min Stock"><Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} /></Field>
                    <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
                </form>
            </Modal>
        </div>
    );
}