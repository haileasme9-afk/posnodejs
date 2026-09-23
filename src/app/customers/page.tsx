import type { Metadata } from "next";
import { PersonIcon } from "@/components/icons";
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
import { dbExtra } from "@/lib/data";
import { compactNumber, titleCase } from "@/lib/format";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function CustomersPage() {
    const customers = await dbExtra.customers();

    return (
        <>
            <PageHeader
                title="Customers"
                description="Accounts that can appear on a receipt"
            />
            {!customers.ok && (
                <div className="mb-4">
                    <DatabaseNotice error={customers.error} />
                </div>
            )}
            <Card
                bodyClassName="p-0"
                title="All customers"
                icon={<PersonIcon width={17} height={17} className="text-primary" />}
            >
                {customers.ok && customers.data.length > 0 ? (
                    <Table>
                        <thead>
                            <tr>
                                <Th>Name</Th>
                                <Th>Username</Th>
                                <Th>Role</Th>
                                <Th>Phone</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.data.map((customer) => (
                                <tr key={customer.id} className="hover:bg-surface-alt">
                                    <Td className="font-medium">{customer.full_name}</Td>
                                    <Td className="text-muted">{customer.username}</Td>
                                    <Td>{titleCase(customer.role)}</Td>
                                    <Td className="text-muted">{customer.phone ?? "—"}</Td>
                                    <Td>
                                        {customer.is_active ? (
                                            <Badge tone="success">Active</Badge>
                                        ) : (
                                            <Badge tone="neutral">Inactive</Badge>
                                        )}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <EmptyState
                        title="No customers yet"
                        description="Customer accounts saved to the database will appear here."
                    />
                )}
            </Card>
            <p className="mt-3 text-xs text-faint">
                {customers.ok ? `${compactNumber(customers.data.length)} records` : ""}
            </p>
        </>
    );
}
