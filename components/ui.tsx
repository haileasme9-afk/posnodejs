import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ------------------------------------------------------------------ *
 * Shared building blocks, styled after the KINGTEWOS TRADING screens.
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
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneBadge[tone]} ${className}`}
        >
            {children}
        </span>
    );
}

export function Card({
    title,
    subtitle,
    icon,
    action,
    children,
    className = "",
    bodyClassName = "",
}: {
    title?: ReactNode;
    subtitle?: ReactNode;
    icon?: ReactNode;
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
                <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                        {icon}
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
                        </div>
                    </div>
                    {action}
                </header>
            )}
            <div className={bodyClassName || "p-5"}>{children}</div>
        </section>
    );
}

type Accent = "indigo" | "green" | "orange" | "purple";

const accentBorder: Record<Accent, string> = {
    indigo: "border-l-stat-indigo",
    green: "border-l-stat-green",
    orange: "border-l-stat-orange",
    purple: "border-l-stat-purple",
};

const accentIcon: Record<Accent, string> = {
    indigo: "bg-stat-indigo/10 text-stat-indigo",
    green: "bg-stat-green/10 text-stat-green",
    orange: "bg-stat-orange/10 text-stat-orange",
    purple: "bg-stat-purple/10 text-stat-purple",
};

export function StatCard({
    label,
    value,
    hint,
    icon,
    accent = "indigo",
}: {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    icon?: ReactNode;
    accent?: Accent;
}) {
    return (
        <div
            className={`flex items-center gap-4 rounded-card border border-border border-l-4 bg-surface p-4 shadow-card ${accentBorder[accent]}`}
        >
            {icon && (
                <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${accentIcon[accent]}`}
                >
                    {icon}
                </span>
            )}
            <div className="min-w-0">
                <p className="truncate text-xl font-bold text-foreground">{value}</p>
                <p className="mt-0.5 text-xs text-muted">{label}</p>
                {hint && <p className="mt-0.5 text-[11px] text-faint">{hint}</p>}
            </div>
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
    "inline-flex items-center justify-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed";

export function Button({
    tone = "primary",
    size = "md",
    loading = false,
    className = "",
    ...props
}: ComponentProps<"button"> & {
    tone?: keyof typeof buttonTone;
    size?: "sm" | "md" | "lg";
    loading?: boolean;
}) {
    const padding =
        size === "sm" ? "px-2.5 py-1.5 text-xs" : size === "lg" ? "px-5 py-2.5 text-base" : "";
    return (
        <button
            className={`${buttonBase} ${buttonTone[tone]} ${padding} ${className}`}
            disabled={props.disabled || loading}
            aria-busy={loading || undefined}
            {...props}
        />
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
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
        </div>
    );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
    return (
        <input
            className={`h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none ${className}`}
            {...props}
        />
    );
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
    return (
        <select
            className={`h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none ${className}`}
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
            className={`border-b border-border bg-surface-alt px-4 py-2.5 text-[11px] font-semibold tracking-wider text-muted uppercase ${alignment} ${className}`}
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
        <td className={`border-b border-border px-4 py-3 text-[13px] text-foreground ${alignment} ${className}`}>
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

export function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-medium tracking-wide text-muted uppercase">
                {label}
            </span>
            {children}
        </label>
    );
}

export function Alert({ children }: { children: ReactNode }) {
    return (
        <div className="rounded-md border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">
            {children}
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
                connection string) in <code>.env.local</code>, run <code>npm run migrate</code>,
                then reload.
            </p>
            {error && (
                <p className="mt-2 rounded-md bg-white/60 px-2 py-1 font-mono text-xs">{error}</p>
            )}
        </Notice>
    );
}
