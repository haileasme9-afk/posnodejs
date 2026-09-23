import type { Metadata } from "next";
import { requirePage } from "@/lib/page-guard";
import { SwapIcon } from "@/components/icons";
import {
    Badge,
    Card,
    DatabaseNotice,
    EmptyState,
    PageHeader,
    Table,
    Td,
    Th,
} from "@/components/ui";
import { currencySymbol, dbExtra } from "@/lib/data";
import { db } from "@/lib/data";
import { compactNumber, formatDateTime, money, titleCase } from "@/lib/format";

export const metadata: Metadata = { title: "Transfers" };
export const dynamic = "force-dynamic";

function statusTone(status: string) {
    if (status === "completed") return "success" as const;
    if (status === "pending") return "warning" as const;
    if (status === "cancelled") return "danger" as const;
    return "neutral" as const;
}

export default async function TransfersPage() {
    await requirePage('transfers');
    const [transfers, settings] = await Promise.all([dbExtra.transfers(), db.settings()]);
    const symbol = settings.ok ? currencySymbol(settings.data) : "Br";

    return (
        <>
            <PageHeader title="Transfers" description="Stock moved between stores" />
            {!transfers.ok && (
                <div className="mb-4">
                    <DatabaseNotice error={transfers.error} />
                </div>
            )}
            <Card
                bodyClassName="p-0"
                title="Store transfers"
                icon={<SwapIcon width={17} height={17} className="text-primary" />}
            >
                {transfers.ok && transfers.data.length > 0 ? (
                    <Table>
                        <thead>
                            <tr>
                                <Th>Reference</Th>
                                <Th>From</Th>
                                <Th>To</Th>
                                <Th align="right">Items</Th>
                                <Th align="right">Value</Th>
                                <Th>Status</Th>
                                <Th>Date</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.data.map((transfer) => (
                                <tr key={transfer.id} className="hover:bg-surface-alt">
                                    <Td className="font-medium">{transfer.reference}</Td>
                                    <Td className="text-muted">{transfer.from_store ?? "—"}</Td>
                                    <Td className="text-muted">{transfer.to_store ?? "—"}</Td>
                                    <Td align="right">{compactNumber(transfer.total_items)}</Td>
                                    <Td align="right">{money(transfer.total_value, symbol)}</Td>
                                    <Td>
                                        <Badge tone={statusTone(transfer.status)}>
                                            {titleCase(transfer.status)}
                                        </Badge>
                                    </Td>
                                    <Td className="text-muted">
                                        {formatDateTime(transfer.created_at)}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <EmptyState
                        title="No transfers yet"
                        description="Transfers created through the API will be listed here."
                    />
                )}
            </Card>
        </>
    );
}
