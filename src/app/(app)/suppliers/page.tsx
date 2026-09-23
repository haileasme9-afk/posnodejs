'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/use-auth';
import { Button, Input, Modal, Field, Table, Loader, PageHeader } from '@/components/ui';

interface Row { id: number; name: string; contact_person: string | null; phone: string | null; email: string | null; address: string | null; }

export default function SuppliersPage() {
    const { loading: authLoading } = useAuth();
    const [rows, setRows] = useState<Row[]>([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);
    const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setRows(await api.get<Row[]>('/api/suppliers'));
    }, []);

    useEffect(() => {
        if (!authLoading) load().catch(() => {});
    }, [authLoading, load]);

    function openCreate() {
        setEditing(null); setForm({ name: '', contact_person: '', phone: '', email: '', address: '' }); setOpen(true);
    }
    function openEdit(r: Row) {
        setEditing(r);
        setForm({ name: r.name, contact_person: r.contact_person || '', phone: r.phone || '', email: r.email || '', address: r.address || '' });
        setOpen(true);
    }

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError(null);
        try {
            if (editing) {
                await api.put(`/api/suppliers?id=${editing.id}`, form);
            } else {
                await api.post('/api/suppliers', form);
            }
            setOpen(false); load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function remove(r: Row) {
        if (!confirm(`Delete supplier "${r.name}"?`)) return;
        await api.del(`/api/suppliers?id=${r.id}`);
        load();
    }

    if (authLoading) return <Loader />;

    return (
        <div>
            <PageHeader title="Suppliers" description="Manage your vendors" actions={<Button onClick={openCreate}>Add Supplier</Button>} />
            <Table
                rowKey={(r) => r.id}
                rows={rows}
                columns={[
                    { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
                    { key: 'contact_person', label: 'Contact', render: (r) => r.contact_person || '-' },
                    { key: 'phone', label: 'Phone', render: (r) => r.phone || '-' },
                    { key: 'email', label: 'Email', render: (r) => r.email || '-' },
                    { key: 'actions', label: '', render: (r) => (
                        <div className="flex gap-2">
                            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => openEdit(r)}>Edit</Button>
                            <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => remove(r)}>Delete</Button>
                        </div>
                    ) },
                ]}
            />
            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} footer={
                <>
                    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Add'}</Button>
                </>
            }>
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <form onSubmit={save} className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><Field label="Name"><Input value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
                    <Field label="Contact Person"><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></Field>
                    <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                    <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                    <Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
                </form>
            </Modal>
        </div>
    );
}