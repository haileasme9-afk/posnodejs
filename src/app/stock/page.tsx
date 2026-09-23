import type { Metadata } from "next";
import Link from "next/link";
import { db, currencySymbol } from "@/lib/data";
import { compactNumber, money } from "@/lib/format";
import {
    Badge,
    Card,
    DatabaseNotice,
    EmptyState,
    PageHeader,
    StatCard,
    Table,
    Td,
    Th,
} from "@/components/ui";
import { AlertIcon, BoxIcon, LayersIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Stock" };
export const dynamic = "force-dynamic";

export default async function StockPage({
    searchParams,
}: {
    searchParams: Promise<{ filter?: string }>;
}) {
    const { filter } = await searchParams;
    const lowOnly = filter === "low";

    const [stock, settings] = await Promise.all([db.stock(lowOnly), db.settings()]);
    const symbol = settings.ok ? currencySymbol(settings.data) : "Br";

    const rows = stock.ok ? stock.data : [];
    const totalUnits = rows.reduce((sum, row) => sum + row.stock_quantity, 0);
    const totalValue = rows.reduce((sum, row) => sum + row.stock_value, 0);
    const lowCount = rows.filter((row) => row.is_low).length;

    return (
        <>
            <PageHeader
                title="Stock"
                description="Quantities on hand across the catalogue"
            >
                <Link
                    href={lowOnly ? "/stock" : "/stock?filter=low"}
                    className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors ${
                        lowOnly
                            ? "border-transparent bg-danger text-white"
                            : "border-border-strong bg-surface text-foreground hover:bg-surface-alt"
                    }`}
                >
                    <AlertIcon width={16} height={16} />
                    {lowOnly ? "Showing low stock" : "Low stock only"}
                </Link>
            </PageHeader>

            {!stock.ok && (
                <div className="mb-4">
                    <DatabaseNotice error={stock.error} />
                </div>
            )}

            <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <StatCard
                    label="Units on hand"
                    value={compactNumber(totalUnits)}
                    icon={<LayersIcon width={18} height={18} />}
                    tone="primary"
                />
                <StatCard
                    label="Stock value"
                    value={money(totalValue, symbol)}
                    hint="At cost price"
                    icon={<BoxIcon width={18} height={18} />}
                    tone="success"
                />
                <StatCard
                    label="Needs restocking"
                    value={compactNumber(lowCount)}
                    hint="At or below minimum"
                    icon={<AlertIcon width={18} height={18} />}
                    tone={lowCount > 0 ? "danger" : "neutral"}
                />
            </div>

            <Card bodyClassName="p-0" title="Inventory levels" subtitle="Lowest quantities first">
                {rows.length > 0 ? (
                    <Table>
                        <thead>
                            <tr>
                                <Th>Product</Th>
                                <Th>On hand</Th>
                                <Th>Level</Th>
                                <Th align="right">Minimum</Th>
                                <Th align="right">Value</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const target = Math.max(row.min_stock * 2, row.min_stock + 1, 1);
                                const percent = Math.min(
                                    100,
                                    Math.round((row.stock_quantity / target) * 100),
                                );
                                return (
                                    <tr key={row.id} className="hover:bg-surface-alt">
                                        <Td className="font-medium">{row.name}</Td>
                                        <Td>
                                            {compactNumber(row.stock_quantity)} {row.unit}
                                        </Td>
                                        <Td className="w-40">
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-alt">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        row.is_low ? "bg-danger" : "bg-success"
                                                    }`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </Td>
                                        <Td align="right" className="text-muted">
                                            {row.min_stock} {row.unit}
                                        </Td>
                                        <Td align="right">{money(row.stock_value, symbol)}</Td>
                                        <Td>
                                            {row.is_low ? (
                                                <Badge tone="danger">Restock</Badge>
                                            ) : (
                                                <Badge tone="success">OK</Badge>
                                            )}
                                        </Td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                ) : (
                    <EmptyState
                        title={lowOnly ? "Nothing needs restocking" : "No stock records"}
                        description={
                            lowOnly
                                ? "Every product is above its minimum quantity."
                                : "Stock levels appear once products exist in the database."
                        }
                    />
                )}
            </Card>
        </>
    );
}
