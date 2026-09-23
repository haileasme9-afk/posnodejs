import { cookies } from 'next/headers';
import crypto from 'node:crypto';

const COOKIE_NAME = 'pos_session';
const SESSION_TTL = 60 * 60 * 24 * 7;

export interface SessionUser {
    id: number;
    username: string;
    full_name: string;
    role: string;
    role_id: number | null;
}

function getSecret(): string {
    return process.env.SESSION_SECRET || 'pos-dev-secret-change-me-in-production';
}

function sign(payload: string): string {
    return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function parseToken(token: string): SessionUser | null {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = sign(payload);
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
        return null;
    }
}

export function buildToken(user: SessionUser): string {
    const payload = Buffer.from(JSON.stringify(user)).toString('base64url');
    return `${payload}.${sign(payload)}`;
}

export async function setSession(user: SessionUser): Promise<void> {
    (await cookies()).set(COOKIE_NAME, buildToken(user), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: SESSION_TTL,
    });
}

export async function destroySession(): Promise<void> {
    (await cookies()).delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return parseToken(token);
}

export function jsonError(status: number, error: string) {
    return new Response(JSON.stringify({ success: false, error }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function requireUser() {
    const session = await getSession();
    if (!session) {
        return { session: null, error: jsonError(401, 'Not authenticated') as Response };
    }
    return { session, error: null as null };
}

export const PAGE_KEYS = [
    'dashboard', 'pos', 'products', 'categories', 'suppliers', 'customers',
    'receiving', 'transfers', 'stock', 'orders', 'reports', 'users', 'settings',
] as const;

const PAGE_ACCESS: Record<string, string[]> = {
    admin: [...PAGE_KEYS],
    manager: PAGE_KEYS.filter((k) => k !== 'users'),
    cashier: ['dashboard', 'pos', 'products', 'orders', 'stock', 'customers'],
};

export function canAccess(role: string | undefined | null, pageKey: string): boolean {
    if (!role) return false;
    if (role === 'admin' || role === 'manager') {
        return PAGE_ACCESS[role]?.includes(pageKey) ?? false;
    }
    return PAGE_ACCESS.cashier.includes(pageKey);
}

export async function requirePermission(pageKey: string) {
    const { session, error } = await requireUser();
    if (error) return { session, error };
    if (!canAccess(session?.role, pageKey)) {
        return { session, error: jsonError(403, 'Forbidden') as Response };
    }
    return { session, error: null as null };
}