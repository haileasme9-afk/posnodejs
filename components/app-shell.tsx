"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Header } from "@/components/header";
import { MobileMenu } from "@/components/mobile-menu";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui";
import { StoreIcon } from "@/components/icons";

export function AppShell({
    children,
    storeName,
    today,
}: {
    children: ReactNode;
    storeName: string;
    today: string;
}) {
    const [open, setOpen] = useState(false);
    const [signedOut, setSignedOut] = useState(false);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    if (signedOut) {
        return (
            <div className="grid min-h-screen place-items-center bg-nav p-6">
                <div className="w-full max-w-sm rounded-card border border-white/10 bg-nav-soft/40 p-6 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-white">
                        <StoreIcon width={22} height={22} />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-white">{storeName}</p>
                    <p className="mt-1 text-sm text-nav-text">
                        You have been signed out of this terminal.
                    </p>
                    <Button className="mt-5 w-full" onClick={() => setSignedOut(false)}>
                        Sign back in
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                open={open}
                onClose={() => setOpen(false)}
                storeName={storeName}
                onLogout={() => setSignedOut(true)}
            />

            <div className="flex min-h-screen flex-col lg:pl-60">
                <Header today={today} onMenu={() => setOpen(true)} />
                <main className="flex-1 px-5 py-5 pb-24 lg:pb-8">{children}</main>
            </div>

            <MobileMenu />
        </div>
    );
}
