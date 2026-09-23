import type { Metadata } from "next";
import Link from "next/link";
import { LicenseBanner } from "@/components/license";
import {
    AlertIcon,
    BoxIcon,
    BagIcon,
    CalendarIcon,
    ChartLineIcon,
    ClockIcon,
} from "@/components/icons";
import {
    Card,
    DatabaseNotice,
    EmptyState,
    StatCard,
    Table,
    Td,
    Th,
} from "@/components/ui";
import { currencySymbol, db, dbExtra } from "@/lib/data";
import { compactNumber, formatDateTime, money } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const [dashboard, monthly, settings] = await Promise.all([
        db.dashboard(),
        dbExtra.monthlySales(),
        db.settings(),
    ]);
    const symbol = settings.ok ? currencySymbol(settings.data) : "Br";
    const data = dashboard.ok ? dashboard.data : null;

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Today's Orders"
                    value={compactNumber(data?.ordersToday ?? 0)}
                    icon={<BagIcon width={20} height={20} />}
                    accent="indigo"
                />
                <StatCard
                    label="Today's Sales"
                    value={money(data?.revenueToday ?? 0, symbol)}
                    icon={<ChartLineIcon width={20} height={20} />}
                    accent="green"
                />
                <StatCard
                    label="Monthly Sales"
                    value={money(monthly.ok ? monthly.data : 0, symbol)}
                    icon={<CalendarIcon width={20} height={20} />}
                    accent="orange"
                />
                <StatCard
                    label="Products"
                    value={compactNumber(data?.productCount ?? 0)}
                    icon={<BoxIcon width={20} height={20} />}
                    accent="purple"
                />
            </div>

            {!dashboard.ok && (
                <div className="mt-4">
                    <DatabaseNotice error={dashboard.error} />
                </div>
            )}

            <div className="mt-5">
                <LicenseBanner />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <Card
                    className="lg:col-span-2"
                    title="Recent Orders"
                    icon={<ClockIcon width={17} height={17} className="text-primary" />}
                    bodyClassName="p-0"
                    action={
                        <Link
                            href="/orders"
                            className="text-xs font-medium text-foreground hover:text-primary"
                        >
                            View All
                        </Link>
                    }
                >
                    {data && data.recentOrders.length > 0 ? (
                        <Table className="min-w-0">
                            <thead>
                                <tr>
                                    <Th>Order #</Th>
                                    <Th>Customer</Th>
                                    <Th>Total</Th>
                                    <Th>Date</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-surface-alt">
                                        <Td className="font-medium">{order.order_number}</Td>
                                        <Td>{order.customer_name}</Td>
                                        <Td>{money(order.total, symbol)}</Td>
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
                            description="Completed sales from the Point of Sale screen will appear here."
                        />
                    )}
                </Card>

                <Card
                    title="Low Stock Products"
                    icon={<AlertIcon width={17} height={17} className="text-primary" />}
                    bodyClassName="p-0"
                >
                    {data && data.lowStock.length > 0 ? (
                        <Table className="min-w-0">
                            <thead>
                                <tr>
                                    <Th>Product</Th>
                                    <Th align="right">Stock</Th>
                                    <Th align="right">Min</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.lowStock.map((item) => (
                                    <tr key={item.id} className="hover:bg-surface-alt">
                                        <Td className="font-medium">{item.name}</Td>
                                        <Td align="right">{compactNumber(item.stock_quantity)}</Td>
                                        <Td align="right" className="text-muted">
                                            {compactNumber(item.min_stock)}
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <EmptyState
                            title="No low stock"
                            description="Products at or below their minimum quantity will be listed here."
                        />
                    )}
                </Card>
            </div>
        </>
    );
}
