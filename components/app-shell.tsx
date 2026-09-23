"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/header";
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
    return (
        <div className="min-h-screen bg-background">
            <Sidebar storeName={storeName} user={user} />

            <div className="flex min-h-screen flex-col pl-52 pb-8 md:pl-60">
                <Header today={today} />
                <main className="flex-1 px-5 py-5 pb-8">{children}</main>
            </div>
        </div>
    );
}
