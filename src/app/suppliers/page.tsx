import type { Metadata } from "next";
import { requirePage } from "@/lib/page-guard";
import { TruckIcon } from "@/components/icons";
import {
    Card,
    DatabaseNotice,
    EmptyState,
    PageHeader,
    Table,
    Td,
    Th,
} from "@/components/ui";
import { dbExtra } from "@/lib/data";
import { compactNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Suppliers" };
export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
    await requirePage('suppliers');
    const suppliers = await dbExtra.suppliers();

    return (
        <>
            <PageHeader
                title="Suppliers"
                description="Vendors that stock the store"
            />
            {!suppliers.ok && (
                <div className="mb-4">
                    <DatabaseNotice error={suppliers.error} />
                </div>
            )}
            <Card
                bodyClassName="p-0"
                title="All suppliers"
                icon={<TruckIcon width={17} height={17} className="text-primary" />}
            >
                {suppliers.ok && suppliers.data.length > 0 ? (
                    <Table>
                        <thead>
                            <tr>
                                <Th>Supplier</Th>
                                <Th>Contact person</Th>
                                <Th>Phone</Th>
                                <Th>Email</Th>
                                <Th align="right">Products</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.data.map((supplier) => (
                                <tr key={supplier.id} className="hover:bg-surface-alt">
                                    <Td className="font-medium">{supplier.name}</Td>
                                    <Td className="text-muted">{supplier.contact_person ?? "—"}</Td>
                                    <Td className="text-muted">{supplier.phone ?? "—"}</Td>
                                    <Td className="text-muted">{supplier.email ?? "—"}</Td>
                                    <Td align="right">{compactNumber(supplier.products)}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <EmptyState
                        title="No suppliers yet"
                        description="Suppliers saved to the database will appear here."
                    />
                )}
            </Card>
        </>
    );
}
