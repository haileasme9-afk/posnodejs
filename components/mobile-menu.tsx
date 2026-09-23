'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/components/ui';

export function MobileMenu({ allowed }: { allowed: string[] }) {
    const pathname = usePathname();
    const items = NAV_ITEMS.filter((i) => allowed.includes(i.key)).slice(0, 5);

    return (
        <div className="fixed inset-x-0 bottom-0 z-20 flex border-t border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 md:hidden">
            {items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={cn(
                            'flex-1 px-1 py-3 text-center text-xs font-medium',
                            active ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400',
                        )}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </div>
    );
}