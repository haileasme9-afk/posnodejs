'use client';

import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect } from 'react';

export function cn(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(' ');
}

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';

const BTN: Record<BtnVariant, string> = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white',
    secondary: 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    ghost: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
    success: 'bg-green-600 text-white hover:bg-green-500',
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: BtnVariant;
    loading?: boolean;
}

export function Button({ variant = 'primary', loading, children, className, disabled, ...rest }: BtnProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                BTN[variant],
                className,
            )}
            disabled={disabled || loading}
            {...rest}
        >
            {loading && <Spinner className="h-4 w-4" />}
            {children}
        </button>
    );
}

const inputCls =
    'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
    const { className, ...rest } = props;
    return <input className={cn(inputCls, className)} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
    const { className, children, ...rest } = props;
    return (
        <select className={cn(inputCls, className)} {...rest}>
            {children}
        </select>
    );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const { className, ...rest } = props;
    return <textarea className={cn(inputCls, 'min-h-20', className)} {...rest} />;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
    return (
        <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
            {children}
            {hint && <span className="text-xs text-zinc-400">{hint}</span>}
        </label>
    );
}

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
    return (
        <div className={cn('rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900', className)}>
            {(title || actions) && (
                <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-700">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
                    <div className="flex items-center gap-2">{actions}</div>
                </div>
            )}
            <div className="p-5">{children}</div>
        </div>
    );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
    return (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
                {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

export function Spinner({ className }: { className?: string }) {
    return (
        <svg className={cn('h-5 w-5 animate-spin text-current', className)} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );
}

export function Loader({ label = 'Loading...' }: { label?: string }) {
    return (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-zinc-400">
            <Spinner />
            <span className="text-sm">{label}</span>
        </div>
    );
}

export function EmptyState({ message = 'No records found' }: { message?: string }) {
    return <div className="py-10 text-center text-sm text-zinc-400">{message}</div>;
}

type Tone = 'green' | 'red' | 'amber' | 'zinc' | 'blue';

const TONES: Record<Tone, string> = {
    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
};

export function Badge({ tone = 'zinc', children }: { tone?: Tone; children: ReactNode }) {
    return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', TONES[tone])}>{children}</span>;
}

export function statusTone(status: string): Tone {
    switch (String(status).toLowerCase()) {
        case 'completed':
        case 'closed':
        case 'active':
        case 'in':
            return 'green';
        case 'refunded':
        case 'cancelled':
        case 'open':
            return 'amber';
        case 'out':
            return 'red';
        default:
            return 'zinc';
    }
}

export function StatCard({ label, value, hint, tone = 'zinc' }: { label: string; value: ReactNode; hint?: string; tone?: Tone }) {
    return (
        <Card>
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
                <p className={cn('text-2xl font-bold', tone === 'green' ? 'text-green-600' : tone === 'red' ? 'text-red-600' : 'text-zinc-900 dark:text-zinc-50')}>
                    {value}
                </p>
                {hint && <p className="text-xs text-zinc-400">{hint}</p>}
            </div>
        </Card>
    );
}

export function Modal({
    open,
    onClose,
    title,
    children,
    footer,
    wide,
}: {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    wide?: boolean;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) {
            document.addEventListener('keydown', onKey);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className={cn('relative max-h-[90vh] w-full overflow-auto rounded-xl bg-white shadow-xl dark:bg-zinc-900', wide ? 'max-w-3xl' : 'max-w-lg')}>
                <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-700">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
                    <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-5">{children}</div>
                {footer && <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-3.5 dark:border-zinc-700">{footer}</div>}
            </div>
        </div>
    );
}

export interface Column<T> {
    key: string;
    label: string;
    render?: (row: T) => ReactNode;
    className?: string;
}

export function Table<T>({ columns, rows, rowKey }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string | number }) {
    if (rows.length === 0) {
        return (
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                <EmptyState />
            </div>
        );
    }
    return (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400">
                        {columns.map((c) => (
                            <th key={c.key} className={cn('px-4 py-3 font-medium', c.className)}>
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {rows.map((row) => (
                        <tr key={rowKey(row)} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                            {columns.map((c) => (
                                <td key={c.key} className={cn('px-4 py-3 text-zinc-700 dark:text-zinc-200', c.className)}>
                                    {c.render ? c.render(row) : String((row as any)[c.key] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function Alert({ tone = 'red', children }: { tone?: Tone; children: ReactNode }) {
    return <div className={cn('rounded-lg border px-4 py-3 text-sm', tone === 'red' && 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-300')}>{children}</div>;
}

export function Toolbar({ children }: { children: ReactNode }) {
    return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}