'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui';

export interface HeaderUser {
    username: string;
    full_name: string;
    role: string;
}

export function Header({ user, siteName }: { user: HeaderUser | null; siteName: string }) {
    const router = useRouter();

    async function logout() {
        try {
            await api.del('/api/auth');
        } catch {
            /* noop */
        }
        router.push('/login');
    }

    return (
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-700 dark:bg-zinc-900 sm:px-6">
            <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {siteName.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{siteName}</span>
            </div>
            {user && (
                <div className="flex items-center gap-3">
                    <div className="hidden text-right sm:block">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{user.full_name || user.username}</p>
                        <p className="text-xs capitalize text-zinc-400">{user.role}</p>
                    </div>
                    <Button variant="secondary" onClick={logout} className="px-3 py-1.5 text-xs">
                        Logout
                    </Button>
                </div>
            )}
        </header>
    );
}