import type { Metadata } from "next";
import { requirePage } from "@/lib/page-guard";
import { db, currencySymbol } from "@/lib/data";
import { compactNumber, money } from "@/lib/format";
import {
    Badge,
    Button,
    Card,
    DatabaseNotice,
    EmptyState,
    Input,
    PageHeader,
    Table,
    Td,
    Th,
} from "@/components/ui";
import { SearchIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    await requirePage('products');
    const { q } = await searchParams;
    const search = q?.trim() ?? "";

    const [products, settings] = await Promise.all([
        db.products(search || undefined),
        db.settings(),
    ]);
    const symbol = settings.ok ? currencySymbol(settings.data) : "Br";

    return (
        <>
            <PageHeader
                title="Products"
                description={
                    products.ok
                        ? `${compactNumber(products.data.length)} products listed`
                        : "Catalogue of every sellable item"
                }
            />

            {!products.ok && (
                <div className="mb-4">
                    <DatabaseNotice error={products.error} />
                </div>
            )}

            <Card bodyClassName="p-0">
                <div className="border-b border-border p-4">
                    <form action="/products" className="flex max-w-lg items-center gap-2">
                        <div className="relative flex-1">
                            <SearchIcon
                                width={16}
                                height={16}
                                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
                            />
                            <Input
                                type="search"
                                name="q"
                                defaultValue={search}
                                placeholder="Search by name, barcode or item code"
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" tone="outline">
                            Search
                        </Button>
                    </form>
                </div>

                {products.ok && products.data.length > 0 ? (
                    <Table>
                        <thead>
                            <tr>
                                <Th>Product</Th>
                                <Th>Category</Th>
                                <Th align="right">Cost</Th>
                                <Th align="right">Price</Th>
                                <Th align="right">Stock</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.data.map((product) => (
                                <tr key={product.id} className="hover:bg-surface-alt">
                                    <Td>
                                        <span className="block font-medium">{product.name}</span>
                                        <span className="block text-xs text-muted">
                                            {product.barcode ?? "No barcode"}
                                        </span>
                                    </Td>
                                    <Td className="text-muted">
                                        {product.category_name ?? "Uncategorised"}
                                    </Td>
                                    <Td align="right" className="text-muted">
                                        {money(product.cost_price, symbol)}
                                    </Td>
                                    <Td align="right" className="font-semibold">
                                        {money(product.selling_price, symbol)}
                                    </Td>
                                    <Td align="right">
                                        {compactNumber(product.stock_quantity)} {product.unit}
                                    </Td>
                                    <Td>
                                        {!product.is_active ? (
                                            <Badge tone="neutral">Inactive</Badge>
                                        ) : product.stock_quantity <= product.min_stock ? (
                                            <Badge tone="danger">Low stock</Badge>
                                        ) : (
                                            <Badge tone="success">In stock</Badge>
                                        )}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <EmptyState
                        title={search ? `No products match “${search}”` : "No products yet"}
                        description={
                            search
                                ? "Try a different name, barcode or item code."
                                : "Add products to the database to see them listed here."
                        }
                    />
                )}
            </Card>
        </>
    );
}
