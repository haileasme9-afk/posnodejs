import type { Metadata } from "next";
import { requirePage } from "@/lib/page-guard";
import { ChartLineIcon, ReportIcon } from "@/components/icons";
import {
    Card,
    DatabaseNotice,
    EmptyState,
    PageHeader,
    StatCard,
    Table,
    Td,
    Th,
} from "@/components/ui";
import { currencySymbol, db, dbExtra } from "@/lib/data";
import { compactNumber, money, titleCase, toNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
    await requirePage('reports');
    const [reports, dashboard, settings] = await Promise.all([
        dbExtra.reports(),
        db.dashboard(),
        db.settings(),
    ]);
    const symbol = settings.ok ? currencySymbol(settings.data) : "Br";

    const data = reports.ok ? reports.data : null;
    const totalRevenue = (data?.payments ?? []).reduce((sum, row) => sum + row.revenue, 0);
    const totalOrders = (data?.payments ?? []).reduce((sum, row) => sum + row.orders, 0);

    return (
        <>
            <PageHeader title="Reports" description="Sales performance across the last two weeks" />
            {(!reports.ok || !dashboard.ok) && (
                <div className="mb-4">
                    <DatabaseNotice error={!reports.ok ? reports.error : !dashboard.ok ? dashboard.error : undefined} />
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    label="Revenue (all time)"
                    value={money(totalRevenue, symbol)}
                    icon={<ChartLineIcon width={20} height={20} />}
                    accent="green"
                />
                <StatCard
                    label="Orders (all time)"
                    value={compactNumber(totalOrders)}
                    icon={<ReportIcon width={20} height={20} />}
                    accent="indigo"
                />
                <StatCard
                    label="Average ticket"
                    value={money(totalOrders ? totalRevenue / totalOrders : 0, symbol)}
                    icon={<ChartLineIcon width={20} height={20} />}
                    accent="purple"
                />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <Card
                    className="lg:col-span-2"
                    bodyClassName="p-0"
                    title="Daily sales — last 14 days"
                    icon={<ReportIcon width={17} height={17} className="text-primary" />}
                >
                    {data && data.daily.length > 0 ? (
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Day</Th>
                                    <Th align="right">Orders</Th>
                                    <Th align="right">Revenue</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.daily.map((row, index) => (
                                    <tr key={index} className="hover:bg-surface-alt">
                                        <Td className="font-medium">{row.day}</Td>
                                        <Td align="right">{compactNumber(row.orders)}</Td>
                                        <Td align="right">{money(row.revenue, symbol)}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <EmptyState
                            title="No sales in this window"
                            description="Days with at least one order will be listed here."
                        />
                    )}
                </Card>

                <Card
                    bodyClassName="p-0"
                    title="Payment methods"
                    subtitle="All time, by revenue"
                >
                    {data && data.payments.length > 0 ? (
                        <Table className="min-w-0">
                            <thead>
                                <tr>
                                    <Th>Method</Th>
                                    <Th align="right">Orders</Th>
                                    <Th align="right">Revenue</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.payments.map((row) => (
                                    <tr key={row.method} className="hover:bg-surface-alt">
                                        <Td className="font-medium">{titleCase(row.method)}</Td>
                                        <Td align="right">{compactNumber(row.orders)}</Td>
                                        <Td align="right">{money(row.revenue, symbol)}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <EmptyState title="No payments yet" />
                    )}
                </Card>
            </div>

            <Card className="mt-4" bodyClassName="p-0" title="Top products" subtitle="By revenue, all time">
                {dashboard.ok && dashboard.data.topProducts.length > 0 ? (
                    <Table>
                        <thead>
                            <tr>
                                <Th>Product</Th>
                                <Th align="right">Sold</Th>
                                <Th align="right">Revenue</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {dashboard.data.topProducts.map((row) => (
                                <tr key={row.product_name} className="hover:bg-surface-alt">
                                    <Td className="font-medium">{row.product_name}</Td>
                                    <Td align="right">{compactNumber(row.qty)}</Td>
                                    <Td align="right">{money(toNumber(row.revenue), symbol)}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <EmptyState
                        title="No product sales yet"
                        description="Best sellers appear once orders record their line items."
                    />
                )}
            </Card>
        </>
    );
}
