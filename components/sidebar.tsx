"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    CartIcon,
    CloseIcon,
    DashboardIcon,
    LayersIcon,
    ReceiptIcon,
    BoxIcon,
    SettingsIcon,
    StoreIcon,
} from "@/components/icons";

export const NAV_ITEMS = [
    { href: "/", label: "Dashboard", icon: DashboardIcon, group: "Overview" },
    { href: "/pos", label: "New Sale", icon: CartIcon, group: "Overview" },
    { href: "/products", label: "Products", icon: BoxIcon, group: "Inventory" },
    { href: "/stock", label: "Stock", icon: LayersIcon, group: "Inventory" },
    { href: "/orders", label: "Orders", icon: ReceiptIcon, group: "Inventory" },
    { href: "/settings", label: "Settings", icon: SettingsIcon, group: "System" },
] as const;

export function isActive(pathname: string, href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    const pathname = usePathname();

    const groups = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS[number][]>>((acc, item) => {
        acc[item.group] = acc[item.group] || [];
        acc[item.group].push(item);
        return acc;
    }, {});

    return (
        <>
            {/* Scrim shown while the drawer is open on small screens */}
            <div
                onClick={onClose}
                aria-hidden="true"
                className={`fixed inset-0 z-30 bg-nav/50 backdrop-blur-[2px] transition-opacity lg:hidden ${
                    open ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
            />

            <aside
                className={`no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-nav text-nav-text transition-transform duration-200 lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-5">
                    <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
                            <StoreIcon width={18} height={18} />
                        </span>
                        <span className="leading-tight">
                            <span className="block text-sm font-semibold text-white">POS System</span>
                            <span className="block text-[11px] text-nav-text/70">Main Store</span>
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="rounded-lg p-1.5 text-nav-text hover:bg-white/10 hover:text-white lg:hidden"
                    >
                        <CloseIcon width={18} height={18} />
                    </button>
                </div>

                <nav className="scroll-thin flex-1 overflow-y-auto px-3 py-4">
                    {Object.entries(groups).map(([group, items]) => (
                        <div key={group} className="mb-5 last:mb-0">
                            <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] text-nav-text/50 uppercase">
                                {group}
                            </p>
                            <ul className="space-y-1">
                                {items.map(({ href, label, icon: Icon }) => {
                                    const active = isActive(pathname, href);
                                    return (
                                        <li key={href}>
                                            <Link
                                                href={href}
                                                onClick={onClose}
                                                aria-current={active ? "page" : undefined}
                                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                                                    active
                                                        ? "bg-primary font-medium text-white"
                                                        : "text-nav-text hover:bg-nav-soft hover:text-white"
                                                }`}
                                            >
                                                <Icon width={18} height={18} />
                                                {label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className="shrink-0 border-t border-white/10 px-5 py-4 text-[11px] text-nav-text/60">
                    <p className="font-medium text-nav-text/80">Signed in as Cashier</p>
                    <p>v0.1.0 · Main Store</p>
                </div>
            </aside>
        </>
    );
}
