"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { MobileMenu } from "@/components/mobile-menu";
import { Sidebar } from "@/components/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
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
            <Sidebar open={open} onClose={() => setOpen(false)} />

            <div className="flex min-h-screen flex-col lg:pl-64">
                <Header onMenu={() => setOpen(true)} />
                <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-12">
                    {children}
                </main>
                <Footer />
            </div>

            <MobileMenu />
        </div>
    );
}
