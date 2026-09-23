import type { Metadata } from "next";
import { requirePage } from "@/lib/page-guard";
import { ReceiveStockForm } from "@/components/receive-stock-form";
import { ReceiveIcon } from "@/components/icons";
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
import { db, dbExtra } from "@/lib/data";
import { compactNumber, formatDateTime, titleCase } from "@/lib/format";

export const metadata: Metadata = { title: "Receive Stock" };
export const dynamic = "force-dynamic";

export default async function ReceiveStockPage() {
    await requirePage('receiving');
    const [products, movements] = await Promise.all([db.products(), dbExtra.stockMovements()]);

    return (
        <>
            <PageHeader
                title="Receive Stock"
                description="Book incoming deliveries against a product"
            />
            {(!products.ok || !movements.ok) && (
                <div className="mb-4">
                    <DatabaseNotice error={!products.ok ? products.error : !movements.ok ? movements.error : undefined} />
                </div>
            )}

            <Card
                title="Receive a delivery"
                subtitle="Creates a stock movement of type “in” and raises the on-hand quantity"
                icon={<ReceiveIcon width={17} height={17} className="text-primary" />}
            >
                <ReceiveStockForm
                    products={
                        products.ok
                            ? products.data.map((product) => ({
                                  id: product.id,
                                  name: product.name,
                                  stock_quantity: product.stock_quantity,
                              }))
                            : []
                    }
                />
            </Card>

            <Card
                className="mt-4"
                bodyClassName="p-0"
                title="Recent movements"
                subtitle="In, out and adjustments, most recent first"
            >
                {movements.ok && movements.data.length > 0 ? (
                    <Table>
                        <thead>
                            <tr>
                                <Th>Product</Th>
                                <Th>Type</Th>
                                <Th align="right">Quantity</Th>
                                <Th>Reference</Th>
                                <Th>Date</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.data.map((movement) => (
                                <tr key={movement.id} className="hover:bg-surface-alt">
                                    <Td className="font-medium">{movement.product_name}</Td>
                                    <Td>
                                        <Badge
                                            tone={
                                                movement.movement_type === "in"
                                                    ? "success"
                                                    : movement.movement_type === "out"
                                                      ? "warning"
                                                      : "primary"
                                            }
                                        >
                                            {titleCase(movement.movement_type)}
                                        </Badge>
                                    </Td>
                                    <Td align="right">
                                        {movement.movement_type === "out" ? "-" : "+"}
                                        {compactNumber(movement.quantity)}
                                    </Td>
                                    <Td className="text-muted">{movement.reference ?? "—"}</Td>
                                    <Td className="text-muted">{formatDateTime(movement.created_at)}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <EmptyState
                        title="No movements yet"
                        description="Received deliveries and sales will be recorded here."
                    />
                )}
            </Card>
        </>
    );
}
