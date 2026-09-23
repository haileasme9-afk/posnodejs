'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/use-auth';
import { Button, Input, Field, Card, Loader, PageHeader, Table, Modal, EmptyState } from '@/components/ui';

interface Store { id: number; name: string; address: string | null; phone: string | null; is_default: boolean; }

const KNOWN_KEYS: Array<{ key: string; label: string; hint?: string; type?: 'number' }> = [
    { key: 'pos_store_name', label: 'Store Name' },
    { key: 'pos_address', label: 'Store Address' },
    { key: 'pos_phone', label: 'Phone' },
    { key: 'currency_symbol', label: 'Currency Symbol', hint: 'e.g. Br' },
    { key: 'tax_rate', label: 'Tax Rate (%)', type: 'number' },
    { key: 'invoice_prefix', label: 'Invoice Prefix', hint: 'e.g. CA' },
    { key: 'pos_customer_default', label: 'Default Customer Name' },
    { key: 'receipt_footer', label: 'Receipt Footer Text' },
];

export default function SettingsPage() {
    const { loading: authLoading } = useAuth();
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [stores, setStores] = useState<Store[]>([]);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [storeModal, setStoreModal] = useState(false);
    const [storeForm, setStoreForm] = useState({ name: '', address: '', phone: '', is_default: false });
    const [savingStore, setSavingStore] = useState(false);

    const load = useCallback(async () => {
        const [s, st] = await Promise.all([api.get<Record<string, string>>('/api/settings'), api.get<Store[]>('/api/stores')]);
        setSettings(s);
        setStores(st);
    }, []);

    useEffect(() => {
        if (authLoading) return;
        load().catch(() => {});
    }, [authLoading, load]);

    async function saveSettings() {
        setBusy(true); setMsg(null);
        try {
            for (const item of KNOWN_KEYS) {
                await api.post('/api/settings', { key: item.key, value: settings[item.key] ?? '' });
            }
            setMsg('Settings saved.');
        } catch (e: any) {
            setMsg(e.message);
        } finally {
            setBusy(false);
            setTimeout(() => setMsg(null), 2500);
        }
    }

    async function saveStore(e: React.FormEvent) {
        e.preventDefault();
        setSavingStore(true);
        try {
            const payload = { ...storeForm, is_default: storeForm.is_default || stores.length === 0 };
            await api.post('/api/stores', payload);
            setStoreModal(false);
            setStoreForm({ name: '', address: '', phone: '', is_default: false });
            load();
        } catch {
            /* handled by ui */
        } finally {
            setSavingStore(false);
        }
    }

    if (authLoading) return <Loader />;

    return (
        <div>
            <PageHeader title="Settings" description="System configuration and stores" />
            {msg && <p className="mb-4 text-sm text-green-600">{msg}</p>}

            <div className="space-y-6">
                <Card title="General Settings" actions={<Button loading={busy} onClick={saveSettings}>Save Settings</Button>}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {KNOWN_KEYS.map((item) => (
                            <Field key={item.key} label={item.label} hint={item.hint}>
                                <Input
                                    type={item.type === 'number' ? 'number' : 'text'}
                                    value={settings[item.key] ?? ''}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, [item.key]: e.target.value }))}
                                />
                            </Field>
                        ))}
                    </div>
                </Card>

                <Card title="Stores" actions={<Button onClick={() => setStoreModal(true)}>Add Store</Button>}>
                    {stores.length === 0 ? (
                        <EmptyState message="No stores configured." />
                    ) : (
                        <Table
                            rowKey={(r) => r.id}
                            rows={stores}
                            columns={[
                                { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name} {r.is_default && '· Default'}</span> },
                                { key: 'address', label: 'Address', render: (r) => r.address || '-' },
                                { key: 'phone', label: 'Phone', render: (r) => r.phone || '-' },
                            ]}
                        />
                    )}
                </Card>
            </div>

            <Modal open={storeModal} onClose={() => setStoreModal(false)} title="Add Store" footer={
                <>
                    <Button variant="secondary" onClick={() => setStoreModal(false)}>Cancel</Button>
                    <Button onClick={saveStore} loading={savingStore}>Add Store</Button>
                </>
            }>
                <form onSubmit={saveStore} className="space-y-4">
                    <Field label="Store Name"><Input value={storeForm.name} required onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} /></Field>
                    <Field label="Address"><Input value={storeForm.address} onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })} /></Field>
                    <Field label="Phone"><Input value={storeForm.phone} onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })} /></Field>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={storeForm.is_default}
                            onChange={(e) => setStoreForm({ ...storeForm, is_default: e.target.checked })}
                            className="h-4 w-4"
                        />
                        Set as default store
                    </label>
                </form>
            </Modal>
        </div>
    );
}