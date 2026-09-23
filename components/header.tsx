"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "@/components/sidebar";
import { BellIcon, CartIcon, MenuIcon, SearchIcon } from "@/components/icons";

function titleFor(pathname: string) {
    const match = NAV_ITEMS.find((item) => isActive(pathname, item.href));
    return match?.label ?? "POS System";
}

export function Header({ onMenu }: { onMenu: () => void }) {
    const pathname = usePathname();

    return (
        <header className="no-print sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
            <button
                type="button"
                onClick={onMenu}
                aria-label="Open navigation"
                className="rounded-lg border border-border-strong p-2 text-foreground hover:bg-surface-alt lg:hidden"
            >
                <MenuIcon width={18} height={18} />
            </button>

            <h1 className="text-base font-semibold text-foreground">{titleFor(pathname)}</h1>

            <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
                <SearchIcon
                    width={16}
                    height={16}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
                />
                <input
                    type="search"
                    placeholder="Search products, orders…"
                    className="h-10 w-full rounded-lg border border-border-strong bg-surface-alt pr-3 pl-9 text-sm text-foreground placeholder:text-faint focus:border-primary focus:bg-surface focus:outline-none"
                />
            </div>

            <button
                type="button"
                aria-label="Notifications"
                className="relative ml-auto rounded-lg border border-border-strong p-2 text-muted hover:bg-surface-alt hover:text-foreground md:ml-0"
            >
                <BellIcon width={18} height={18} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
            </button>

            <Link
                href="/pos"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
                <CartIcon width={18} height={18} />
                <span className="hidden sm:inline">New sale</span>
            </Link>

            <div className="hidden items-center gap-2.5 border-l border-border pl-3 sm:flex">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    AD
                </span>
                <span className="leading-tight">
                    <span className="block text-sm font-medium text-foreground">Admin</span>
                    <span className="block text-[11px] text-muted">admin@pos.com</span>
                </span>
            </div>
        </header>
    );
}
