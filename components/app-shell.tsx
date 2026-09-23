"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Header } from "@/components/header";
import { MobileMenu } from "@/components/mobile-menu";
import { Sidebar } from "@/components/sidebar";

export type ShellUser = { fullName: string; role: string } | null;

export function AppShell({
    children,
    storeName,
    today,
    user,
}: {
    children: ReactNode;
    storeName: string;
    today: string;
    user: ShellUser;
}) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <Sidebar open={open} onClose={() => setOpen(false)} storeName={storeName} user={user} />

            <div className="flex min-h-screen flex-col lg:pl-60">
                <Header today={today} onMenu={() => setOpen(true)} />
                <main className="flex-1 px-5 py-5 pb-24 lg:pb-8">{children}</main>
            </div>

            <MobileMenu />
        </div>
    );
}
