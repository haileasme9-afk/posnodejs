import type { Metadata } from "next";
import { TagIcon } from "@/components/icons";
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
import { compactNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
    const categories = await dbExtra.categories();

    return (
        <>
            <PageHeader
                title="Categories"
                description={
                    categories.ok
                        ? `${compactNumber(categories.data.length)} product groups`
                        : "Product groups used across the catalogue"
                }
            />
            {!categories.ok && (
                <div className="mb-4">
                    <DatabaseNotice error={categories.error} />
                </div>
            )}
            <Card
                bodyClassName="p-0"
                title="All categories"
                icon={<TagIcon width={17} height={17} className="text-primary" />}
            >
                {categories.ok && categories.data.length > 0 ? (
                    <Table>
                        <thead>
                            <tr>
                                <Th>Name</Th>
                                <Th>Description</Th>
                                <Th align="right">Products</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.data.map((category) => (
                                <tr key={category.id} className="hover:bg-surface-alt">
                                    <Td className="font-medium">{category.name}</Td>
                                    <Td className="text-muted">{category.description ?? "—"}</Td>
                                    <Td align="right">{compactNumber(category.products)}</Td>
                                    <Td>
                                        {category.is_active ? (
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
                        title="No categories yet"
                        description="Categories created in the database will be listed here."
                    />
                )}
            </Card>
        </>
    );
}
