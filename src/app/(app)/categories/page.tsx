'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/use-auth';
import { Button, Input, Modal, Field, Table, Loader, PageHeader } from '@/components/ui';

interface Row { id: number; name: string; description: string | null; is_active: boolean; }

export default function CategoriesPage() {
    const { loading: authLoading } = useAuth();
    const [rows, setRows] = useState<Row[]>([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setRows(await api.get<Row[]>('/api/categories'));
    }, []);

    useEffect(() => {
        if (!authLoading) load().catch(() => {});
    }, [authLoading, load]);

    function openCreate() {
        setEditing(null); setName(''); setDescription(''); setOpen(true);
    }
    function openEdit(r: Row) {
        setEditing(r); setName(r.name); setDescription(r.description || ''); setOpen(true);
    }

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError(null);
        try {
            if (editing) {
                await api.put(`/api/categories?id=${editing.id}`, { name, description });
            } else {
                await api.post('/api/categories', { name, description });
            }
            setOpen(false); load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function remove(r: Row) {
        if (!confirm(`Delete category "${r.name}"?`)) return;
        await api.del(`/api/categories?id=${r.id}`);
        load();
    }

    if (authLoading) return <Loader />;

    return (
        <div>
            <PageHeader title="Categories" description="Organize your products" actions={<Button onClick={openCreate}>Add Category</Button>} />
            <Table
                rowKey={(r) => r.id}
                rows={rows}
                columns={[
                    { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
                    { key: 'description', label: 'Description', render: (r) => r.description || '-' },
                    { key: 'actions', label: '', render: (r) => (
                        <div className="flex gap-2">
                            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => openEdit(r)}>Edit</Button>
                            <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => remove(r)}>Delete</Button>
                        </div>
                    ) },
                ]}
            />
            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Category' : 'Add Category'} footer={
                <>
                    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Add'}</Button>
                </>
            }>
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <form onSubmit={save} className="space-y-4">
                    <Field label="Name"><Input value={name} required onChange={(e) => setName(e.target.value)} /></Field>
                    <Field label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
                </form>
            </Modal>
        </div>
    );
}