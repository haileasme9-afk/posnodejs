import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/data";
import { formatHeaderDate } from "@/lib/format";

export const metadata: Metadata = {
    title: {
        default: "POS System",
        template: "%s · POS System",
    },
    description: "Point of Sale System",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#232059",
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await db.settings();
    const storeName = settings.ok
        ? (settings.data.store_name || "KINGTEWOS TRADING")
        : "KINGTEWOS TRADING";

    return (
        <html lang="en">
            <body className="min-h-screen bg-background text-foreground antialiased">
                <AppShell storeName={storeName} today={formatHeaderDate()}>
                    {children}
                </AppShell>
            </body>
        </html>
    );
}
