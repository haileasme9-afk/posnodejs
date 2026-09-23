import type { Metadata } from "next";
import { db, DEFAULT_SETTINGS } from "@/lib/data";
import { Badge, Card, DatabaseNotice, PageHeader } from "@/components/ui";
import { StoreIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const FIELDS = [
    { key: "store_name", label: "Store name" },
    { key: "store_address", label: "Address" },
    { key: "store_phone", label: "Phone" },
    { key: "store_email", label: "Email" },
    { key: "currency_symbol", label: "Currency symbol" },
    { key: "tax_rate", label: "Tax rate (%)" },
    { key: "low_stock_threshold", label: "Low stock threshold" },
    { key: "receipt_footer", label: "Receipt footer" },
];

export default async function SettingsPage() {
    const settings = await db.settings();
    const values = settings.ok ? settings.data : { ...DEFAULT_SETTINGS };

    return (
        <>
            <PageHeader
                title="Settings"
                description="Store profile, tax and receipt defaults"
            >
                <Badge tone={settings.ok ? "success" : "warning"}>
                    {settings.ok ? "Connected" : "Not connected"}
                </Badge>
            </PageHeader>

            {!settings.ok && (
                <div className="mb-4">
                    <DatabaseNotice error={settings.error} />
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2" title="Store profile">
                    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                        {FIELDS.map((field) => (
                            <div key={field.key}>
                                <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">
                                    {field.label}
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-foreground">
                                    {values[field.key] ?? "—"}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </Card>

                <Card title="Terminal">
                    <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                            <StoreIcon width={18} height={18} />
                        </span>
                        <div className="text-sm">
                            <p className="font-medium text-foreground">Main Store</p>
                            <p className="text-muted">Default register · cashier role</p>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted">
                        Settings are read from the <code>settings</code> table. Editing them is
                        handled by <code>PUT /api/settings</code>.
                    </p>
                </Card>
            </div>
        </>
    );
}
