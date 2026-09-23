import type { Metadata } from "next";
import { requirePage } from "@/lib/page-guard";
import { PosTerminal } from "@/components/pos-terminal";
import { PageHeader } from "@/components/ui";
import { currencySymbol, db, taxRate } from "@/lib/data";
import { toNumber } from "@/lib/format";

export const metadata: Metadata = { title: "New Sale" };
export const dynamic = "force-dynamic";

export default async function PosPage() {
    await requirePage('pos');
    const [products, settings] = await Promise.all([db.products(), db.settings()]);

    const catalogue = products.ok ? products.data : [];
    const symbol = settings.ok ? currencySymbol(settings.data) : "Br";

    return (
        <>
            <PageHeader
                title="Point of Sale"
                description="Pick items, take payment and save the receipt"
            />
            <PosTerminal
                initialProducts={catalogue.map((product) => ({
                    id: product.id,
                    name: product.name,
                    barcode: product.barcode,
                    category_name: product.category_name,
                    selling_price: toNumber(product.selling_price),
                    stock_quantity: toNumber(product.stock_quantity),
                    unit: product.unit,
                }))}
                initialError={products.ok ? undefined : products.error}
                symbol={symbol}
                taxRatePct={settings.ok ? taxRate(settings.data) : 10}
            />
        </>
    );
}
