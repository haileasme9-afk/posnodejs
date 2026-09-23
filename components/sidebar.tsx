'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/components/ui';

export function Sidebar({ allowed }: { allowed: string[] }) {
    const pathname = usePathname();
    const items = NAV_ITEMS.filter((i) => allowed.includes(i.key));

    return (
        <nav className="hidden w-52 shrink-0 border-r border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900 md:block">
            <ul className="space-y-1">
                {items.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                        <li key={item.key}>
                            <Link
                                href={item.href}
                                className={cn(
                                    'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    active
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
                                )}
                            >
                                {item.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}