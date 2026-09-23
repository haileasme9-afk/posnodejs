import { redirect } from 'next/navigation';
import { getSession, canAccess } from '@/lib/auth';

export async function requirePage(pageKey: string) {
    const session = await getSession();
    if (!session) redirect('/login');
    if (!canAccess(session.role, pageKey)) redirect('/dashboard');
    return session;
}

export async function getAllowed() {
    const session = await getSession();
    if (!session) return [];
    const { PAGE_KEYS } = await import('@/lib/auth').then((m) => m);
    return PAGE_KEYS.filter((k) => canAccess(session.role, k)).map(String);
}