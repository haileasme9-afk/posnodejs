import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

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
    themeColor: "#0f172a",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-background text-foreground antialiased">
                <AppShell>{children}</AppShell>
            </body>
        </html>
    );
}
