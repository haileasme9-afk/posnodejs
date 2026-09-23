import type { Metadata } from "next";
import { requirePage } from "@/lib/page-guard";
import Link from "next/link";
import { db, currencySymbol } from "@/lib/data";
import { formatDateTime, money, titleCase, toNumber } from "@/lib/format";
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
import { CashIcon, ReceiptIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const FILTERS = [
    { id: "", label: "All" },
    { id: "completed", label: "Completed" },
    { id: "pending", label: "Pending" },
    { id: "cancelled", label: "Cancelled" },
];

function statusTone(status: string) {
    if (status === "completed") return "success" as const;
    if (status === "pending") return "warning" as const;
    if (status === "cancelled") return "danger" as const;
    return "neutral" as const;
}

export default async function OrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    await requirePage('orders');
    const { status } = await searchParams;
    const active = FILTERS.some((filter) => filter.id === status) ? (status ?? "") : "";

    const [orders, settings] = await Promise.all([
        db.orders(active || undefined),
        db.settings(),
    ]);
    const symbol = settings.ok ? currencySymbol(settings.data) : "Br";

    const rows = orders.ok ? orders.data : [];
    const revenue = rows.reduce((sum, order) => sum + toNumber(order.total), 0);

    return (
        <>
            <PageHeader title="Orders" description="Every sale recorded by the terminal" />

            {!orders.ok && (
                <div className="mb-4">
                    <DatabaseNotice error={orders.error} />
                </div>
            )}

            <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <StatCard
                    label="Orders shown"
                    value={String(rows.length)}
                    icon={<ReceiptIcon width={18} height={18} />}
                    accent="indigo"
                />
                <StatCard
                    label="Revenue shown"
                    value={money(revenue, symbol)}
                    icon={<CashIcon width={18} height={18} />}
                    accent="green"
                />
                <StatCard
                    label="Average ticket"
                    value={money(rows.length ? revenue / rows.length : 0, symbol)}
                    hint="Per order"
                    accent="purple"
                />
            </div>

            <Card
                bodyClassName="p-0"
                title="Order history"
                subtitle="Most recent first"
                action={
                    <div className="no-scrollbar flex gap-1 overflow-x-auto">
                        {FILTERS.map((filter) => (
                            <Link
                                key={filter.id || "all"}
                                href={filter.id ? `/orders?status=${filter.id}` : "/orders"}
                                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                    active === filter.id
                                        ? "bg-primary text-white"
                                        : "text-muted hover:bg-surface-alt hover:text-foreground"
                                }`}
                            >
                                {filter.label}
                            </Link>
                        ))}
                    </div>
                }
            >
                {rows.length > 0 ? (
                    <Table>
                        <thead>
                            <tr>
                                <Th>Receipt</Th>
                                <Th>Customer</Th>
                                <Th>Cashier</Th>
                                <Th>Payment</Th>
                                <Th>Status</Th>
                                <Th align="right">Total</Th>
                                <Th>Date</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((order) => (
                                <tr key={order.id} className="hover:bg-surface-alt">
                                    <Td className="font-medium">{order.order_number}</Td>
                                    <Td>{order.customer_name}</Td>
                                    <Td className="text-muted">{order.user_name ?? "—"}</Td>
                                    <Td className="text-muted">{titleCase(order.payment_method)}</Td>
                                    <Td>
                                        <Badge tone={statusTone(order.status)}>
                                            {titleCase(order.status)}
                                        </Badge>
                                    </Td>
                                    <Td align="right" className="font-semibold">
                                        {money(order.total, symbol)}
                                    </Td>
                                    <Td className="text-muted">{formatDateTime(order.created_at)}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <EmptyState
                        title={active ? `No ${active} orders` : "No orders yet"}
                        description="Completed sales from the POS terminal will be listed here."
                    />
                )}
            </Card>
        </>
    );
}
