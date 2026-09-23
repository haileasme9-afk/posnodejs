"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LicenseChip } from "@/components/license";
import {
    BoxIcon,
    CartIcon,
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
    storeName,
    user,
}: {
    storeName: string;
    user: { fullName: string; role: string } | null;
}) {
    const pathname = usePathname();
    const router = useRouter();

    async function logout() {
        await fetch("/api/auth", { method: "DELETE" }).catch(() => undefined);
        router.push("/login");
        router.refresh();
    }

    const displayName = user?.fullName ?? "System Administrator";
    const initials = displayName
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <aside className="no-print fixed inset-y-0 left-0 z-40 flex w-52 flex-col bg-nav md:w-60">
            <div className="flex h-14 shrink-0 items-center justify-between gap-2 bg-nav-deep/60 px-4">
                <Link href="/" className="flex min-w-0 items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-white">
                        <StoreIcon width={16} height={16} />
                    </span>
                    <span className="truncate text-[13px] font-bold tracking-wide text-white uppercase">
                        {storeName}
                    </span>
                </Link>
            </div>

            <nav className="scroll-thin-nav flex-1 overflow-y-auto px-2.5 py-3">
                <ul className="space-y-1">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                        const active = isActive(pathname, href);
                        return (
                            <li key={href}>
                                <Link
                                    href={href}
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
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-semibold text-white">
                            {initials || <PersonIcon width={15} height={15} />}
                        </span>
                        <span className="min-w-0 leading-tight">
                            <span className="block truncate text-[13px] text-nav-text">
                                {displayName}
                            </span>
                            <span className="block text-[11px] text-nav-text/60 capitalize">
                                {user?.role ?? "admin"}
                            </span>
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => void logout()}
                        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-danger hover:bg-white/5"
                    >
                        <LogoutIcon width={16} height={16} />
                        Logout
                    </button>
                </div>
            </aside>
    );
}
