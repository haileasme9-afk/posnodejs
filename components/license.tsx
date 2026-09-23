"use client";

import { useState } from "react";
import { getLicense } from "@/lib/license";
import { Button } from "@/components/ui";
import { GearIcon, KeyIcon } from "@/components/icons";

function useLicense() {
    return getLicense();
}

/** Small chip used at the bottom of the sidebar: “License: Active · 350d”. */
export function LicenseChip() {
    const license = useLicense();
    return (
        <div className="flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-2 text-[11px]">
            <KeyIcon width={13} height={13} className="shrink-0 text-stat-green" />
            <span className="text-nav-text">
                License:{" "}
                <span className={license.active ? "font-semibold text-stat-green" : "font-semibold text-danger"}>
                    {license.active ? "Active" : "Expired"}
                </span>
            </span>
            <span className="ml-auto font-medium text-nav-text/80">{license.daysRemaining}d</span>
        </div>
    );
}

/** Banner on the dashboard: status, days remaining, expiry + Manage License button. */
export function LicenseBanner() {
    const license = useLicense();
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col gap-3 rounded-card border border-border bg-surface px-4 py-3 shadow-card sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-stat-green/10 text-stat-green">
                        <KeyIcon width={18} height={18} />
                    </span>
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            License:{" "}
                            <span className={license.active ? "font-semibold text-success" : "font-semibold text-danger"}>
                                {license.active ? "Active" : "Expired"}
                            </span>
                        </p>
                        <p className="text-xs text-muted">
                            {license.daysRemaining} day(s) remaining. Expires {license.expiresOn}
                        </p>
                    </div>
                </div>
                <Button size="sm" className="sm:ml-auto" onClick={() => setOpen(true)}>
                    <GearIcon width={14} height={14} />
                    Manage License
                </Button>
            </div>

            {open && (
                <div
                    className="fixed inset-0 z-50 grid place-items-center bg-nav/60 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Manage license"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="w-full max-w-sm rounded-card border border-border bg-surface p-5 shadow-pop"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-lg bg-stat-green/10 text-stat-green">
                                <KeyIcon width={18} height={18} />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Software license</p>
                                <p className="text-xs text-muted">POS System · single store</p>
                            </div>
                        </div>
                        <dl className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted">Status</dt>
                                <dd className={license.active ? "font-semibold text-success" : "font-semibold text-danger"}>
                                    {license.active ? "Active" : "Expired"}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted">Days remaining</dt>
                                <dd className="font-semibold text-foreground">{license.daysRemaining}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted">Expires on</dt>
                                <dd className="font-semibold text-foreground">{license.expiresOn}</dd>
                            </div>
                        </dl>
                        <div className="mt-5 flex justify-end gap-2">
                            <Button tone="outline" size="sm" onClick={() => setOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
