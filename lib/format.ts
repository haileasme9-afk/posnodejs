/** Formatting helpers shared by server and client components. */

export function toNumber(value: unknown): number {
    const n = typeof value === "number" ? value : Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
}

export function money(value: unknown, symbol = "Br"): string {
    const amount = toNumber(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${symbol}${amount}`;
}

export function compactNumber(value: unknown): string {
    return toNumber(value).toLocaleString("en-US");
}

export function toDate(value: unknown): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value: unknown): string {
    const date = toDate(value);
    if (!date) return "—";
    return date.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

/** "Wed, Sep 23, 2026" — the format shown in the reference header. */
export function formatHeaderDate(date = new Date()): string {
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

export function formatDate(value: unknown): string {
    const date = toDate(value);
    if (!date) return "—";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function titleCase(value: unknown): string {
    const text = String(value ?? "");
    return text.charAt(0).toUpperCase() + text.slice(1);
}
