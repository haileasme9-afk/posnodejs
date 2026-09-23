import type { Metadata } from "next";
import { requirePage } from "@/lib/page-guard";
import { db, currencySymbol } from "@/lib/data";
import { compactNumber } from "@/lib/format";
import { Card, DatabaseNotice, Input, PageHeader, Button } from "@/components/ui";
import { SearchIcon } from "@/components/icons";
import { ProductEditor } from "@/components/product-editor";

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

                <ProductEditor
                    initialProducts={products.ok ? products.data : []}
                    symbol={symbol}
                    search={search}
                />
            </Card>
        </>
    );
}