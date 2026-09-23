'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Input, Field, Alert } from '@/components/ui';

export function LoginForm() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post('/api/auth', { username, password });
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
            setLoading(false);
        }
    }

    const pv = (process.env.NEXT_PUBLIC_SITE_NAME as string) || 'POS System';

    return (
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
            <div className="space-y-1 text-center">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{pv}</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Sign in to continue</p>
            </div>
            {error && <Alert>{error}</Alert>}
            <Field label="Username">
                <Input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required autoComplete="username" />
            </Field>
            <Field label="Password">
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </Field>
            <Button type="submit" className="w-full" loading={loading}>
                Sign In
            </Button>
            <p className="text-center text-xs text-zinc-400">Default: admin / admin123</p>
        </form>
    );
}