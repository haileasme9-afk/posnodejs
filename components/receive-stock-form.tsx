"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Input, Notice, Select } from "@/components/ui";
import { ReceiveIcon } from "@/components/icons";

export type ReceiveFormProduct = { id: number; name: string; stock_quantity: number };

export function ReceiveStockForm({ products }: { products: ReceiveFormProduct[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [productId, setProductId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [reference, setReference] = useState("");
    const [error, setError] = useState<string | null>(null);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);

        const qty = Number(quantity);
        if (!productId) return setError("Pick a product first.");
        if (!Number.isFinite(qty) || qty <= 0) return setError("Quantity must be a positive number.");

        try {
            const response = await fetch("/api/stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    product_id: Number(productId),
                    movement_type: "in",
                    quantity: Math.floor(qty),
                    reference: reference.trim() || null,
                    notes: "Received through Receive Stock",
                    created_by: 1,
                }),
            });
            const json = await response.json();
            if (!response.ok || !json.success) {
                throw new Error(json.error ?? `Request failed (${response.status})`);
            }
            setQuantity("");
            setReference("");
            startTransition(() => router.refresh());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not receive stock");
        }
    }

    return (
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px_minmax(0,1fr)_auto]">
            <div>
                <label htmlFor="rs-product" className="mb-1 block text-[11px] font-medium text-muted uppercase">
                    Product
                </label>
                <Select id="rs-product" value={productId} onChange={(e) => setProductId(e.target.value)}>
                    <option value="">Select product…</option>
                    {products.map((product) => (
                        <option key={product.id} value={product.id}>
                            {product.name} (on hand: {product.stock_quantity})
                        </option>
                    ))}
                </Select>
            </div>
            <div>
                <label htmlFor="rs-qty" className="mb-1 block text-[11px] font-medium text-muted uppercase">
                    Quantity
                </label>
                <Input
                    id="rs-qty"
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                />
            </div>
            <div>
                <label htmlFor="rs-ref" className="mb-1 block text-[11px] font-medium text-muted uppercase">
                    Reference (GRN / invoice)
                </label>
                <Input
                    id="rs-ref"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Optional"
                />
            </div>
            <div className="flex items-end">
                <Button type="submit" disabled={pending || products.length === 0}>
                    <ReceiveIcon width={16} height={16} />
                    {pending ? "Saving…" : "Receive"}
                </Button>
            </div>
            {error && (
                <div className="sm:col-span-4">
                    <Notice tone="danger" title="Stock not received">
                        <p>{error}</p>
                    </Notice>
                </div>
            )}
        </form>
    );
}
