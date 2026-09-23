"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive } from "@/components/sidebar";
import { BoxIcon, CartIcon, DashboardIcon, ReceiptIcon } from "@/components/icons";

const TABS = [
    { href: "/", label: "Home", icon: DashboardIcon },
    { href: "/pos", label: "Sell", icon: CartIcon },
    { href: "/products", label: "Products", icon: BoxIcon },
    { href: "/orders", label: "Orders", icon: ReceiptIcon },
] as const;

export function MobileMenu() {
    const pathname = usePathname();

    return (
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-surface/95 backdrop-blur lg:hidden [padding-bottom:env(safe-area-inset-bottom)]">
            {TABS.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                    <Link
                        key={href}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                            active ? "text-primary" : "text-muted hover:text-foreground"
                        }`}
                    >
                        <Icon width={20} height={20} />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
