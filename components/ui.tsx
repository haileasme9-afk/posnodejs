import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ------------------------------------------------------------------ *
 * Small, shared building blocks used across every page.
 * ------------------------------------------------------------------ */

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

const toneBadge: Record<Tone, string> = {
    neutral: "bg-surface-alt text-muted border-border",
    primary: "bg-primary-soft text-primary border-primary-ring",
    success: "bg-success-soft text-success border-success/25",
    warning: "bg-warning-soft text-warning border-warning/25",
    danger: "bg-danger-soft text-danger border-danger/25",
};

export function Badge({
    tone = "neutral",
    children,
    className = "",
}: {
    tone?: Tone;
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${toneBadge[tone]} ${className}`}
        >
            {children}
        </span>
    );
}

export function Card({
    title,
    subtitle,
    action,
    children,
    className = "",
    bodyClassName = "",
}: {
    title?: ReactNode;
    subtitle?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
}) {
    return (
        <section
            className={`rounded-card border border-border bg-surface shadow-card ${className}`}
        >
            {(title || action) && (
                <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                    <div>
                        {title && (
                            <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
                        )}
                        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
                    </div>
                    {action}
                </header>
            )}
            <div className={bodyClassName || "p-5"}>{children}</div>
        </section>
    );
}

export function StatCard({
    label,
    value,
    hint,
    icon,
    tone = "primary",
}: {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    icon?: ReactNode;
    tone?: Tone;
}) {
    return (
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
                {icon && (
                    <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${toneBadge[tone]}`}
                    >
                        {icon}
                    </span>
                )}
            </div>
            <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
    );
}

const buttonTone: Record<string, string> = {
    primary:
        "bg-primary text-white border-transparent hover:bg-primary-hover disabled:bg-primary/50",
    outline:
        "bg-surface text-foreground border-border-strong hover:bg-surface-alt disabled:text-faint",
    soft: "bg-primary-soft text-primary border-transparent hover:bg-primary-ring/60 disabled:text-faint",
    danger: "bg-danger text-white border-transparent hover:bg-danger/90 disabled:bg-danger/50",
    ghost: "bg-transparent text-muted border-transparent hover:bg-surface-alt hover:text-foreground",
};

const buttonBase =
    "inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed";

export function Button({
    tone = "primary",
    size = "md",
    className = "",
    ...props
}: ComponentProps<"button"> & { tone?: keyof typeof buttonTone; size?: "sm" | "md" | "lg" }) {
    const padding =
        size === "sm" ? "px-2.5 py-1.5 text-xs" : size === "lg" ? "px-5 py-2.5 text-base" : "";
    return (
        <button className={`${buttonBase} ${buttonTone[tone]} ${padding} ${className}`} {...props} />
    );
}

export function LinkButton({
    tone = "primary",
    size = "md",
    className = "",
    ...props
}: ComponentProps<typeof Link> & { tone?: keyof typeof buttonTone; size?: "sm" | "md" | "lg" }) {
    const padding =
        size === "sm" ? "px-2.5 py-1.5 text-xs" : size === "lg" ? "px-5 py-2.5 text-base" : "";
    return (
        <Link className={`${buttonBase} ${buttonTone[tone]} ${padding} ${className}`} {...props} />
    );
}

export function PageHeader({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children?: ReactNode;
}) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h1>
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
        </div>
    );
}

export function Input({
    className = "",
    ...props
}: ComponentProps<"input">) {
    return (
        <input
            className={`h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none ${className}`}
            {...props}
        />
    );
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
    return (
        <select
            className={`h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none ${className}`}
            {...props}
        />
    );
}

export function Table({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <div className={`scroll-thin overflow-x-auto ${className}`}>
            <table className="w-full min-w-[560px] border-collapse text-sm">{children}</table>
        </div>
    );
}

export function Th({
    children,
    align = "left",
    className = "",
}: {
    children?: ReactNode;
    align?: "left" | "right" | "center";
    className?: string;
}) {
    const alignment =
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
    return (
        <th
            className={`border-b border-border bg-surface-alt px-4 py-2.5 text-xs font-semibold tracking-wide text-muted uppercase ${alignment} ${className}`}
        >
            {children}
        </th>
    );
}

export function Td({
    children,
    align = "left",
    className = "",
}: {
    children?: ReactNode;
    align?: "left" | "right" | "center";
    className?: string;
}) {
    const alignment =
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
    return (
        <td className={`border-b border-border px-4 py-3 text-foreground ${alignment} ${className}`}>
            {children}
        </td>
    );
}

export function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

export function Notice({
    tone = "warning",
    title,
    children,
}: {
    tone?: Tone;
    title: string;
    children?: ReactNode;
}) {
    return (
        <div className={`rounded-card border px-4 py-3 text-sm ${toneBadge[tone]}`}>
            <p className="font-semibold">{title}</p>
            {children && <div className="mt-1 leading-relaxed opacity-90">{children}</div>}
        </div>
    );
}

export function DatabaseNotice({ error }: { error?: string }) {
    return (
        <Notice tone="warning" title="Database not connected">
            <p>
                This page renders live data from Postgres. Set <code>DATABASE_URL</code> (a Neon
                connection string) in <code>.env.local</code>, run{" "}
                <code>npm run migrate</code>, then reload.
            </p>
            {error && (
                <p className="mt-2 rounded-md bg-white/60 px-2 py-1 font-mono text-xs">{error}</p>
            )}
        </Notice>
    );
}
