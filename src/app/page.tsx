import type { Metadata } from "next";
import Link from "next/link";
import { db, currencySymbol } from "@/lib/data";
import { compactNumber, formatDateTime, money, titleCase, toNumber } from "@/lib/format";
import {
    Badge,
    Card,
    DatabaseNotice,
    EmptyState,
    LinkButton,
    PageHeader,
    StatCard,
    Table,
    Td,
    Th,
} from "@/components/ui";
import {
    AlertIcon,
    ArrowUpRightIcon,
    BoxIcon,
    CartIcon,
    CashIcon,
    LayersIcon,
} from "@/components/icons";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const [dashboard, settings] = await Promise.all([db.dashboard(), db.settings()]);
    const symbol = settings.ok ? currencySymbol(settings.data) : "Br";

    const data = dashboard.ok ? dashboard.data : null;
    const peakDay = data?.salesByDay.reduce((max, day) => Math.max(max, day.total), 0) ?? 0;

    return (
        <>
            <PageHeader
                title="Dashboard"
                description="Today's performance across the store"
            >
                <LinkButton href="/products" tone="outline">
                    <BoxIcon width={16} height={16} />
                    Manage products
                </LinkButton>
                <LinkButton href="/pos">
                    <CartIcon width={16} height={16} />
                    Start a sale
                </LinkButton>
            </PageHeader>

            {!dashboard.ok && (
                <div className="mb-6">
                    <DatabaseNotice error={dashboard.error} />
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Sales today"
                    value={money(data?.revenueToday ?? 0, symbol)}
                    hint={`${data?.ordersToday ?? 0} orders completed`}
                    icon={<CashIcon width={18} height={18} />}
                    tone="primary"
                />
                <StatCard
                    label="Orders today"
                    value={compactNumber(data?.ordersToday ?? 0)}
                    hint="All payment methods"
                    icon={<CartIcon width={18} height={18} />}
                    tone="success"
                />
                <StatCard
                    label="Products"
                    value={compactNumber(data?.productCount ?? 0)}
                    hint={`${compactNumber(data?.stockUnits ?? 0)} units on hand`}
                    icon={<BoxIcon width={18} height={18} />}
                    tone="neutral"
                />
                <StatCard
                    label="Low stock items"
                    value={compactNumber(data?.lowStockCount ?? 0)}
                    hint={`Stock value ${money(data?.stockValue ?? 0, symbol)}`}
                    icon={<AlertIcon width={18} height={18} />}
                    tone={toNumber(data?.lowStockCount) > 0 ? "danger" : "neutral"}
                />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <Card
                    className="lg:col-span-2"
                    title="Sales — last 7 days"
                    subtitle="Gross revenue per day"
                    action={
                        <Link
                            href="/orders"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                            View orders
                            <ArrowUpRightIcon width={14} height={14} />
                        </Link>
                    }
                >
                    {data && data.salesByDay.length > 0 ? (
                        <div className="flex h-44 items-end gap-3">
                            {data.salesByDay.map((day, index) => {
                                const height = peakDay > 0 ? (day.total / peakDay) * 100 : 0;
                                return (
                                    <div key={index} className="flex flex-1 flex-col items-center gap-2">
                                        <span className="text-[11px] font-medium text-muted">
                                            {money(day.total, symbol)}
                                        </span>
                                        <div className="flex w-full flex-1 items-end">
                                            <div
                                                className="w-full rounded-t-md bg-primary/85 transition-colors hover:bg-primary"
                                                style={{ height: `${Math.max(height, 4)}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] text-faint">{day.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            title="No sales recorded yet"
                            description="Completed orders from the last seven days will appear here."
                        />
                    )}
                </Card>

                <Card
                    title="Low stock alerts"
                    subtitle="At or below the minimum level"
                    bodyClassName="divide-y divide-border"
                >
                    {data && data.lowStock.length > 0 ? (
                        <ul>
                            {data.lowStock.map((item) => (
                                <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-danger-soft text-danger">
                                        <LayersIcon width={16} height={16} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-foreground">
                                            {item.name}
                                        </span>
                                        <span className="block text-xs text-muted">
                                            Min {item.min_stock} {item.unit}
                                        </span>
                                    </span>
                                    <Badge tone="danger">
                                        {item.stock_quantity} {item.unit}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            title="Stock levels look healthy"
                            description="No product has dropped to its minimum quantity."
                        />
                    )}
                </Card>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <Card
                    className="lg:col-span-2"
                    title="Recent sales"
                    subtitle="Latest completed and pending orders"
                    bodyClassName="p-0"
                    action={
                        <Link
                            href="/orders"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                            All orders
                            <ArrowUpRightIcon width={14} height={14} />
                        </Link>
                    }
                >
                    {data && data.recentOrders.length > 0 ? (
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Receipt</Th>
                                    <Th>Customer</Th>
                                    <Th>Payment</Th>
                                    <Th align="right">Total</Th>
                                    <Th>When</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-surface-alt">
                                        <Td className="font-medium">{order.order_number}</Td>
                                        <Td>{order.customer_name}</Td>
                                        <Td>
                                            <Badge
                                                tone={
                                                    order.payment_method === "cash"
                                                        ? "success"
                                                        : "primary"
                                                }
                                            >
                                                {titleCase(order.payment_method)}
                                            </Badge>
                                        </Td>
                                        <Td align="right" className="font-semibold">
                                            {money(order.total, symbol)}
                                        </Td>
                                        <Td className="text-muted">
                                            {formatDateTime(order.created_at)}
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <EmptyState
                            title="No orders yet"
                            description="Ring up your first sale from the POS screen."
                            action={
                                <LinkButton href="/pos" size="sm">
                                    Start a sale
                                </LinkButton>
                            }
                        />
                    )}
                </Card>

                <Card title="Top products" subtitle="By revenue, all time">
                    {data && data.topProducts.length > 0 ? (
                        <ul className="space-y-3">
                            {data.topProducts.map((product, index) => (
                                <li key={product.product_name} className="flex items-center gap-3">
                                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                                        {index + 1}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-foreground">
                                            {product.product_name}
                                        </span>
                                        <span className="block text-xs text-muted">
                                            {compactNumber(product.qty)} sold
                                        </span>
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {money(product.revenue, symbol)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            title="Nothing sold yet"
                            description="Your best sellers will be listed here."
                        />
                    )}
                </Card>
            </div>
        </>
    );
}
