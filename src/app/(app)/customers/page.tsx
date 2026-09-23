'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/use-auth';
import { Button, Input, Modal, Field, Table, Loader, PageHeader, Toolbar } from '@/components/ui';

interface Row { id: number; name: string; phone: string | null; email: string | null; address: string | null; company: string | null; tax_number: string | null; }

export default function CustomersPage() {
    const { loading: authLoading } = useAuth();
    const [rows, setRows] = useState<Row[]>([]);
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);
    const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', company: '', tax_number: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setRows(await api.get<Row[]>('/api/customers' + (q ? `?q=${encodeURIComponent(q)}` : '')));
    }, [q]);

    useEffect(() => {
        if (authLoading) return;
        const t = setTimeout(() => load().catch(() => {}), 250);
        return () => clearTimeout(t);
    }, [authLoading, load]);

    function openCreate() {
        setEditing(null); setForm({ name: '', phone: '', email: '', address: '', company: '', tax_number: '' }); setOpen(true);
    }
    function openEdit(r: Row) {
        setEditing(r);
        setForm({ name: r.name, phone: r.phone || '', email: r.email || '', address: r.address || '', company: r.company || '', tax_number: r.tax_number || '' });
        setOpen(true);
    }

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError(null);
        try {
            if (editing) {
                await api.put(`/api/customers?id=${editing.id}`, form);
            } else {
                await api.post('/api/customers', form);
            }
            setOpen(false); load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function remove(r: Row) {
        if (!confirm(`Delete customer "${r.name}"?`)) return;
        await api.del(`/api/customers?id=${r.id}`);
        load();
    }

    if (authLoading) return <Loader />;

    return (
        <div>
            <PageHeader title="Customers" description="Manage your customer directory" actions={<Button onClick={openCreate}>Add Customer</Button>} />
            <Toolbar>
                <Input className="max-w-xs" placeholder="Search by name, phone..." value={q} onChange={(e) => setQ(e.target.value)} />
            </Toolbar>
            <Table
                rowKey={(r) => r.id}
                rows={rows}
                columns={[
                    { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
                    { key: 'phone', label: 'Phone', render: (r) => r.phone || '-' },
                    { key: 'company', label: 'Company', render: (r) => r.company || '-' },
                    { key: 'tax_number', label: 'TIN', render: (r) => r.tax_number || '-' },
                    { key: 'email', label: 'Email', render: (r) => r.email || '-' },
                    { key: 'actions', label: '', render: (r) => (
                        <div className="flex gap-2">
                            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => openEdit(r)}>Edit</Button>
                            <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => remove(r)}>Delete</Button>
                        </div>
                    ) },
                ]}
            />
            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'} footer={
                <>
                    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Add'}</Button>
                </>
            }>
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <form onSubmit={save} className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><Field label="Name"><Input value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
                    <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                    <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                    <Field label="Company"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
                    <Field label="TIN"><Input value={form.tax_number} onChange={(e) => setForm({ ...form, tax_number: e.target.value })} /></Field>
                    <div className="col-span-2"><Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field></div>
                </form>
            </Modal>
        </div>
    );
}