"use client";

import { useCallback, useMemo, useState } from "react";
import {
    Badge,
    Button,
    EmptyState,
    Input,
    Notice,
} from "@/components/ui";
import {
    AlertIcon,
    CardIcon,
    CartIcon,
    CashIcon,
    CheckIcon,
    CloseIcon,
    MinusIcon,
    PhoneIcon,
    PlusIcon,
    PrinterIcon,
    SearchIcon,
    TrashIcon,
} from "@/components/icons";
import { money, toNumber } from "@/lib/format";
import type { ProductRow } from "@/lib/data";

type Product = Pick<
    ProductRow,
    "id" | "name" | "barcode" | "category_name" | "selling_price" | "stock_quantity" | "unit"
>;

export type PosTerminalProps = {
    initialProducts: Product[];
    initialError?: string;
    symbol: string;
    taxRatePct: number;
};

type CartLine = {
    product: Product;
    quantity: number;
};

const PAYMENT_METHODS = [
    { id: "cash", label: "Cash", icon: CashIcon },
    { id: "card", label: "Card", icon: CardIcon },
    { id: "mobile", label: "Mobile", icon: PhoneIcon },
] as const;

const round2 = (value: number) => Math.round(value * 100) / 100;

export function PosTerminal({
    initialProducts,
    initialError,
    symbol: initialSymbol,
    taxRatePct: initialTaxRate,
}: PosTerminalProps) {
    // The catalogue is loaded on the server; these fetches only run on
    // explicit user actions (retry / after a sale), so no mount effect is needed.
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(initialError ?? null);

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    const [cart, setCart] = useState<CartLine[]>([]);
    const [customer, setCustomer] = useState("Walk-in Customer");
    const [payment, setPayment] = useState<(typeof PAYMENT_METHODS)[number]["id"]>("cash");
    const [amountPaid, setAmountPaid] = useState("");

    const [taxRatePct, setTaxRatePct] = useState(initialTaxRate);
    const [symbol, setSymbol] = useState(initialSymbol);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [receipt, setReceipt] = useState<{ number: string; total: number; change: number } | null>(
        null,
    );

    const loadProducts = useCallback(async () => {
        try {
            const [productsRes, settingsRes] = await Promise.all([
                fetch("/api/products?limit=200&active_only=true"),
                fetch("/api/settings"),
            ]);
            if (productsRes.status === 401) {
                throw new Error("Session expired — sign in again to load products.");
            }
            const productsJson = await productsRes.json();
            if (!productsJson.success) throw new Error(productsJson.error ?? "Could not load products");

            setProducts(
                (productsJson.data as Product[]).map((p) => ({
                    ...p,
                    selling_price: toNumber(p.selling_price),
                    stock_quantity: toNumber(p.stock_quantity),
                })),
            );

            if (settingsRes.ok) {
                const settingsJson = await settingsRes.json();
                if (settingsJson.success && settingsJson.data) {
                    setSymbol(settingsJson.data.currency_symbol || "Br");
                    setTaxRatePct(toNumber(settingsJson.data.tax_rate ?? 10));
                }
            }
            setLoadError(null);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Could not load products");
        } finally {
            setLoading(false);
        }
    }, []);

    const categories = useMemo(() => {
        const set = new Set<string>(["All"]);
        for (const product of products) {
            if (product.category_name) set.add(product.category_name);
        }
        return [...set];
    }, [products]);

    const visibleProducts = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return products.filter((product) => {
            const matchesCategory = category === "All" || product.category_name === category;
            const matchesSearch =
                !needle ||
                product.name.toLowerCase().includes(needle) ||
                (product.barcode ?? "").toLowerCase().includes(needle);
            return matchesCategory && matchesSearch;
        });
    }, [products, search, category]);

    const subtotal = round2(
        cart.reduce((sum, line) => sum + line.product.selling_price * line.quantity, 0),
    );
    const taxAmount = round2((subtotal * taxRatePct) / 100);
    const total = round2(subtotal + taxAmount);
    const paid = toNumber(amountPaid);
    const change = payment === "cash" ? round2(Math.max(paid - total, 0)) : 0;
    const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

    function addProduct(product: Product) {
        setReceipt(null);
        setSubmitError(null);
        setCart((current) => {
            const existing = current.find((line) => line.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock_quantity) return current;
                return current.map((line) =>
                    line.product.id === product.id
                        ? { ...line, quantity: line.quantity + 1 }
                        : line,
                );
            }
            if (product.stock_quantity <= 0) return current;
            return [...current, { product, quantity: 1 }];
        });
    }

    function setQuantity(productId: number, quantity: number) {
        setCart((current) =>
            current
                .map((line) =>
                    line.product.id === productId
                        ? { ...line, quantity: Math.min(Math.max(quantity, 0), line.product.stock_quantity) }
                        : line,
                )
                .filter((line) => line.quantity > 0),
        );
    }

    function removeLine(productId: number) {
        setCart((current) => current.filter((line) => line.product.id !== productId));
    }

    function resetSale() {
        setCart([]);
        setCustomer("Walk-in Customer");
        setAmountPaid("");
        setPayment("cash");
        setSubmitError(null);
    }

    async function completeSale() {
        if (cart.length === 0 || submitting) return;
        setSubmitting(true);
        setSubmitError(null);

        // The orders API recomputes prices, tax, stock deductions and
        // movements server-side inside one transaction, so the client only
        // sends what was picked and how it was paid for.
        const payload = {
            customer_name: customer.trim() || "Walk-in Customer",
            payment_method: payment,
            amount_paid: payment === "cash" ? paid || total : undefined,
            discount: 0,
            items: cart.map((line) => ({
                product_id: line.product.id,
                quantity: line.quantity,
            })),
        };

        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await response.json();
            if (response.status === 401) {
                throw new Error("Session expired — sign in again to save the sale.");
            }
            if (!response.ok || !json.success) {
                throw new Error(json.error ?? `Request failed (${response.status})`);
            }

            const order = Array.isArray(json.data) ? json.data[0] : json.data;
            const orderNumber: string = order?.order_number ?? "—";

            setReceipt({ number: orderNumber, total, change });
            resetSale();
            void loadProducts();
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Could not complete the sale");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            {/* ---------------- Product catalogue ---------------- */}
            <section className="min-w-0">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <SearchIcon
                            width={16}
                            height={16}
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
                        />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Scan barcode or search by name"
                            className="pl-9"
                        />
                    </div>
                    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                        {categories.map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => setCategory(name)}
                                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    category === name
                                        ? "border-transparent bg-primary text-white"
                                        : "border-border-strong bg-surface text-muted hover:text-foreground"
                                }`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>

                {loadError && (
                    <div className="mb-4">
                        <Notice tone="danger" title="Products could not be loaded">
                            <p>{loadError}</p>
                            <Button
                                tone="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                    setLoading(true);
                                    void loadProducts();
                                }}
                            >
                                Try again
                            </Button>
                        </Notice>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-28 animate-pulse rounded-card border border-border bg-surface"
                            />
                        ))}
                    </div>
                ) : visibleProducts.length === 0 ? (
                    <div className="rounded-card border border-border bg-surface">
                        <EmptyState
                            title="No products match"
                            description="Adjust the search text or pick another category."
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {visibleProducts.map((product) => {
                            const soldOut = product.stock_quantity <= 0;
                            return (
                                <button
                                    key={product.id}
                                    type="button"
                                    disabled={soldOut}
                                    onClick={() => addProduct(product)}
                                    className={`flex h-28 flex-col justify-between rounded-card border p-3 text-left transition-colors ${
                                        soldOut
                                            ? "cursor-not-allowed border-border bg-surface-alt opacity-60"
                                            : "border-border bg-surface shadow-card hover:border-primary hover:bg-primary-soft/40"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="line-clamp-2 text-sm font-medium text-foreground">
                                            {product.name}
                                        </span>
                                        {soldOut ? (
                                            <Badge tone="danger">Out</Badge>
                                        ) : (
                                            <span className="shrink-0 text-[11px] text-faint">
                                                {product.stock_quantity} {product.unit}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <span className="text-base font-semibold text-foreground">
                                            {money(product.selling_price, symbol)}
                                        </span>
                                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-soft text-primary">
                                            <PlusIcon width={14} height={14} />
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ---------------- Cart ---------------- */}
            <aside className="xl:sticky xl:top-20 xl:self-start">
                <div className="flex flex-col rounded-card border border-border bg-surface shadow-card">
                    <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
                                <CartIcon width={16} height={16} />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Current sale</p>
                                <p className="text-[11px] text-muted">
                                    {itemCount} {itemCount === 1 ? "item" : "items"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={resetSale}
                            className="rounded-lg p-1.5 text-muted hover:bg-surface-alt hover:text-foreground"
                            aria-label="Clear sale"
                        >
                            <TrashIcon width={16} height={16} />
                        </button>
                    </header>

                    <div className="border-b border-border px-4 py-3">
                        <label className="mb-1 block text-[11px] font-medium tracking-wide text-muted uppercase">
                            Customer
                        </label>
                        <Input
                            value={customer}
                            onChange={(event) => setCustomer(event.target.value)}
                            placeholder="Walk-in Customer"
                        />
                    </div>

                    <div className="scroll-thin max-h-[42vh] overflow-y-auto px-4 py-2">
                        {cart.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted">
                                Tap a product to add it to the sale.
                            </p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {cart.map((line) => (
                                    <li key={line.product.id} className="flex items-center gap-3 py-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-foreground">
                                                {line.product.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {money(line.product.selling_price, symbol)} each
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 rounded-lg border border-border-strong">
                                            <button
                                                type="button"
                                                aria-label={`Decrease ${line.product.name}`}
                                                onClick={() => setQuantity(line.product.id, line.quantity - 1)}
                                                className="grid h-7 w-7 place-items-center text-muted hover:text-foreground"
                                            >
                                                <MinusIcon width={14} height={14} />
                                            </button>
                                            <span className="w-6 text-center text-sm font-medium">
                                                {line.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                aria-label={`Increase ${line.product.name}`}
                                                onClick={() => setQuantity(line.product.id, line.quantity + 1)}
                                                disabled={line.quantity >= line.product.stock_quantity}
                                                className="grid h-7 w-7 place-items-center text-muted hover:text-foreground disabled:opacity-40"
                                            >
                                                <PlusIcon width={14} height={14} />
                                            </button>
                                        </div>
                                        <span className="w-20 text-right text-sm font-semibold">
                                            {money(line.product.selling_price * line.quantity, symbol)}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${line.product.name}`}
                                            onClick={() => removeLine(line.product.id)}
                                            className="text-faint hover:text-danger"
                                        >
                                            <CloseIcon width={14} height={14} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="space-y-2 border-b border-border px-4 py-3 text-sm">
                        <div className="flex justify-between text-muted">
                            <span>Subtotal</span>
                            <span>{money(subtotal, symbol)}</span>
                        </div>
                        <div className="flex justify-between text-muted">
                            <span>Tax ({taxRatePct}%)</span>
                            <span>{money(taxAmount, symbol)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
                            <span>Total</span>
                            <span>{money(total, symbol)}</span>
                        </div>
                    </div>

                    <div className="space-y-3 px-4 py-3">
                        <div className="grid grid-cols-3 gap-2">
                            {PAYMENT_METHODS.map((method) => {
                                const Icon = method.icon;
                                const active = payment === method.id;
                                return (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setPayment(method.id)}
                                        className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                                            active
                                                ? "border-primary bg-primary-soft text-primary"
                                                : "border-border-strong text-muted hover:text-foreground"
                                        }`}
                                    >
                                        <Icon width={16} height={16} />
                                        {method.label}
                                    </button>
                                );
                            })}
                        </div>

                        {payment === "cash" && (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-muted">
                                        Cash received
                                    </label>
                                    <Input
                                        inputMode="decimal"
                                        value={amountPaid}
                                        onChange={(event) => setAmountPaid(event.target.value)}
                                        placeholder={total.toFixed(2)}
                                    />
                                </div>
                                <div>
                                    <span className="mb-1 block text-[11px] font-medium text-muted">
                                        Change
                                    </span>
                                    <p className="flex h-10 items-center rounded-lg border border-border bg-surface-alt px-3 text-sm font-semibold text-foreground">
                                        {money(change, symbol)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {submitError && (
                            <Notice tone="danger" title="Sale not completed">
                                <p>{submitError}</p>
                            </Notice>
                        )}

                        {receipt && !submitError && (
                            <div className="rounded-lg border border-success/25 bg-success-soft px-3 py-2 text-sm text-success">
                                <p className="flex items-center gap-2 font-semibold">
                                    <CheckIcon width={16} height={16} />
                                    Sale {receipt.number} saved
                                </p>
                                <p className="mt-0.5 text-xs">
                                    Total {money(receipt.total, symbol)} · Change{" "}
                                    {money(receipt.change, symbol)}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium underline"
                                >
                                    <PrinterIcon width={14} height={14} />
                                    Print receipt
                                </button>
                            </div>
                        )}

                        <Button
                            size="lg"
                            className="w-full"
                            disabled={cart.length === 0 || submitting}
                            onClick={() => void completeSale()}
                        >
                            {submitting ? (
                                "Saving…"
                            ) : (
                                <>
                                    <CashIcon width={18} height={18} />
                                    Complete sale · {money(total, symbol)}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {!loading && !loadError && (
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-faint">
                        <AlertIcon width={14} height={14} />
                        Stock is deducted when the sale is saved.
                    </p>
                )}
            </aside>
        </div>
    );
}
