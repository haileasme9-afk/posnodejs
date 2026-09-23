"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LicenseChip } from "@/components/license";
import {
    BoxIcon,
    CartIcon,
    CloseIcon,
    DashboardIcon,
    LogoutIcon,
    PersonIcon,
    ReceiptIcon,
    ReceiveIcon,
    ReportIcon,
    StackIcon,
    StoreIcon,
    SwapIcon,
    TagIcon,
    TruckIcon,
} from "@/components/icons";

export const NAV_ITEMS = [
    { href: "/", label: "Dashboard", icon: DashboardIcon },
    { href: "/pos", label: "Point of Sale", icon: CartIcon },
    { href: "/products", label: "Products", icon: BoxIcon },
    { href: "/categories", label: "Categories", icon: TagIcon },
    { href: "/suppliers", label: "Suppliers", icon: TruckIcon },
    { href: "/customers", label: "Customers", icon: PersonIcon },
    { href: "/receive-stock", label: "Receive Stock", icon: ReceiveIcon },
    { href: "/transfers", label: "Transfers", icon: SwapIcon },
    { href: "/stock", label: "Stock Management", icon: StackIcon },
    { href: "/orders", label: "Orders", icon: ReceiptIcon },
    { href: "/reports", label: "Reports", icon: ReportIcon },
] as const;

export function isActive(pathname: string, href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar({
    open,
    onClose,
    storeName,
    onLogout,
}: {
    open: boolean;
    onClose: () => void;
    storeName: string;
    onLogout: () => void;
}) {
    const pathname = usePathname();

    return (
        <>
            <div
                onClick={onClose}
                aria-hidden="true"
                className={`no-print fixed inset-0 z-30 bg-nav-deep/60 backdrop-blur-[2px] transition-opacity lg:hidden ${
                    open ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
            />

            <aside
                className={`no-print fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-nav transition-transform duration-200 lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-14 shrink-0 items-center justify-between gap-2 bg-nav-deep/60 px-4">
                    <Link href="/" onClick={onClose} className="flex min-w-0 items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-white">
                            <StoreIcon width={16} height={16} />
                        </span>
                        <span className="truncate text-[13px] font-bold tracking-wide text-white uppercase">
                            {storeName}
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="rounded-md p-1.5 text-nav-text hover:bg-white/10 hover:text-white lg:hidden"
                    >
                        <CloseIcon width={16} height={16} />
                    </button>
                </div>

                <nav className="scroll-thin-nav flex-1 overflow-y-auto px-2.5 py-3">
                    <ul className="space-y-1">
                        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                            const active = isActive(pathname, href);
                            return (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        onClick={onClose}
                                        aria-current={active ? "page" : undefined}
                                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors ${
                                            active
                                                ? "bg-nav-soft font-medium text-white shadow-[inset_3px_0_0_0_var(--color-primary)]"
                                                : "text-nav-text hover:bg-white/5 hover:text-white"
                                        }`}
                                    >
                                        <Icon width={17} height={17} className="shrink-0" />
                                        {label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="shrink-0 space-y-2 border-t border-white/10 px-3 py-3">
                    <LicenseChip />
                    <div className="flex items-center gap-2.5 px-1">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-nav-text">
                            <PersonIcon width={15} height={15} />
                        </span>
                        <span className="truncate text-[13px] text-nav-text">System Administrator</span>
                    </div>
                    <button
                        type="button"
                        onClick={onLogout}
                        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-danger hover:bg-white/5"
                    >
                        <LogoutIcon width={16} height={16} />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
