'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/use-auth';
import { Button, Input, Modal, Select, Field, Table, Loader, PageHeader, Card, Badge, EmptyState } from '@/components/ui';

interface Row { id: number; username: string; full_name: string; email: string | null; phone: string | null; role: string; is_active: boolean; }

export default function UsersPage() {
    const { me, loading: authLoading } = useAuth();
    const [rows, setRows] = useState<Row[]>([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);
    const [form, setForm] = useState({ username: '', password: '', full_name: '', email: '', phone: '', role: 'cashier' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setRows(await api.get<Row[]>('/api/users'));
    }, []);

    useEffect(() => {
        if (authLoading) return;
        load().catch(() => {});
    }, [authLoading, load]);

    function openCreate() {
        setEditing(null); setForm({ username: '', password: '', full_name: '', email: '', phone: '', role: 'cashier' }); setOpen(true);
    }
    function openEdit(r: Row) {
        setEditing(r); setForm({ username: r.username, password: '', full_name: r.full_name, email: r.email || '', phone: r.phone || '', role: r.role }); setOpen(true);
    }

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError(null);
        const payload = { username: form.username, full_name: form.full_name, email: form.email, phone: form.phone, role: form.role, is_active: editing ? true : undefined };
        const withPwd = form.password ? { ...payload, password: form.password } : payload;
        try {
            if (editing) {
                await api.put(`/api/users?id=${editing.id}`, withPwd);
            } else {
                await api.post('/api/users', withPwd);
            }
            setOpen(false); load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(r: Row) {
        await api.put(`/api/users?id=${r.id}`, { username: r.username, full_name: r.full_name, email: r.email, phone: r.phone, role: r.role, is_active: !r.is_active });
        load();
    }

    if (authLoading) return <Loader />;

    const isAdmin = me?.role === 'admin';

    return (
        <div>
            <PageHeader title="Users" description="Manage system users" actions={isAdmin ? <Button onClick={openCreate}>Add User</Button> : undefined} />
            {!isAdmin ? (
                <Card><EmptyState message="Only administrators can manage users." /></Card>
            ) : (
                <Table
                    rowKey={(r) => r.id}
                    rows={rows}
                    columns={[
                        { key: 'username', label: 'Username', render: (r) => <span className="font-medium">{r.username}</span> },
                        { key: 'full_name', label: 'Name' },
                        { key: 'email', label: 'Email', render: (r) => r.email || '-' },
                        { key: 'role', label: 'Role', render: (r) => <Badge tone="blue">{r.role}</Badge> },
                        { key: 'is_active', label: 'Status', render: (r) => <Badge tone={r.is_active ? 'green' : 'zinc'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
                        { key: 'actions', label: '', render: (r) => (
                            <div className="flex gap-2">
                                <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => openEdit(r)}>Edit</Button>
                                <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => toggleActive(r)}>{r.is_active ? 'Deactivate' : 'Activate'}</Button>
                            </div>
                        ) },
                    ]}
                />
            )}

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit User' : 'Add User'} footer={
                <>
                    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Add User'}</Button>
                </>
            }>
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <form onSubmit={save} className="grid grid-cols-2 gap-4">
                    <Field label="Username"><Input value={form.username} required disabled={!!editing} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
                    <Field label={editing ? 'New Password (blank to keep)' : 'Password'}><Input type="password" value={form.password} required={!editing} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
                    <div className="col-span-2"><Field label="Full Name"><Input value={form.full_name} required onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field></div>
                    <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                    <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                    <div className="col-span-2">
                        <Field label="Role">
                            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="cashier">Cashier</option>
                            </Select>
                        </Field>
                    </div>
                </form>
            </Modal>
        </div>
    );
}