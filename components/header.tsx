"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "@/components/sidebar";

function titleFor(pathname: string) {
    const match = NAV_ITEMS.find((item) => isActive(pathname, item.href));
    return match?.label ?? "Dashboard";
}

export function Header({ today }: { today: string }) {
    const pathname = usePathname();

    return (
        <header className="no-print sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b-2 border-accent bg-surface px-5">
            <h1 className="text-[17px] font-semibold text-foreground">{titleFor(pathname)}</h1>
            <p className="ml-auto text-[13px] text-muted">{today}</p>
        </header>
    );
}
