"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge, Button, Field, Input, Select } from "@/components/ui";
import { BoxIcon, CloseIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { fileToDataUrl, money, toNumber } from "@/lib/format";
import type { ProductRow } from "@/lib/data";

type EditorForm = {
    name: string;
    barcode: string;
    item_code: string;
    category_id: string;
    supplier_id: string;
    cost_price: string;
    selling_price: string;
    stock_quantity: string;
    min_stock: string;
    unit: string;
    image: string;
    is_active: boolean;
};

const EMPTY_FORM: EditorForm = {
    name: "",
    barcode: "",
    item_code: "",
    category_id: "",
    supplier_id: "",
    cost_price: "0",
    selling_price: "0",
    stock_quantity: "0",
    min_stock: "5",
    unit: "pcs",
    image: "",
    is_active: true,
};

function Thumb({ src, className = "h-12 w-12" }: { src: string | null; className?: string }) {
    if (!src) {
        return (
            <span
                className={`grid shrink-0 place-items-center rounded-lg bg-surface-alt text-faint ${className}`}
            >
                <BoxIcon width={22} height={22} />
            </span>
        );
    }
    return <img src={src} alt="" className={`shrink-0 rounded-lg object-cover ${className}`} />;
}

export function ProductEditor({
    initialProducts,
    initialLoading = false,
    symbol,
    search = "",
}: {
    initialProducts: ProductRow[];
    initialLoading?: boolean;
    symbol: string;
    search?: string;
}) {
    const [products, setProducts] = useState<ProductRow[]>(initialProducts);
    const [loading, setLoading] = useState(initialLoading);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ProductRow | null>(null);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
    const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
    const [form, setForm] = useState<EditorForm>(EMPTY_FORM);

    const reload = useCallback(
        async (withLoader = false) => {
            if (withLoader) setLoading(true);
            try {
                const data = await api.get<ProductRow[]>(
                    "/api/products?limit=200" + (search ? `&q=${encodeURIComponent(search)}` : ""),
                );
                setProducts(data);
                setError(null);
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Could not load products");
            } finally {
                setLoading(false);
            }
        },
        [search],
    );

    useEffect(() => {
        setProducts(initialProducts);
        setLoading(initialLoading);
    }, [initialProducts, initialLoading]);

    useEffect(() => {
        api.get<Array<{ id: number; name: string }>>("/api/categories").then(setCategories).catch(() => {});
        api.get<Array<{ id: number; name: string }>>("/api/suppliers").then(setSuppliers).catch(() => {});
    }, []);

    function openCreate() {
        setEditing(null);
        setForm(EMPTY_FORM);
        setError(null);
        setOpen(true);
    }

    function openEdit(product: ProductRow) {
        setEditing(product);
        setForm({
            name: product.name,
            barcode: product.barcode ?? "",
            item_code: "",
            category_id: product.category_id ? String(product.category_id) : "",
            supplier_id: product.supplier_id ? String(product.supplier_id) : "",
            cost_price: String(toNumber(product.cost_price)),
            selling_price: String(toNumber(product.selling_price)),
            stock_quantity: String(toNumber(product.stock_quantity)),
            min_stock: String(toNumber(product.min_stock)),
            unit: product.unit,
            image: product.image ?? "",
            is_active: product.is_active,
        });
        setError(null);
        setOpen(true);
    }

    async function pickImage(file: File | undefined) {
        if (!file) return;
        try {
            const url = await fileToDataUrl(file);
            setForm((prev) => ({ ...prev, image: url }));
        } catch {
            setError("Could not read image file");
        }
    }

    async function save(event: React.FormEvent) {
        event.preventDefault();
        setSaving(true);
        setError(null);
        const payload = {
            name: form.name,
            barcode: form.barcode || null,
            item_code: form.item_code || null,
            category_id: form.category_id ? Number(form.category_id) : null,
            supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
            cost_price: toNumber(form.cost_price),
            selling_price: toNumber(form.selling_price),
            stock_quantity: toNumber(form.stock_quantity),
            min_stock: toNumber(form.min_stock),
            unit: form.unit,
            image: form.image || null,
            is_active: form.is_active,
        };
        try {
            if (editing) {
                await api.put(`/api/products?id=${editing.id}`, payload);
            } else {
                await api.post("/api/products", payload);
            }
            setOpen(false);
            await reload();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save product");
        } finally {
            setSaving(false);
        }
    }

    async function remove(product: ProductRow) {
        if (!confirm(`Delete product "${product.name}"?`)) return;
        try {
            await api.del(`/api/products?id=${product.id}`);
            await reload();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not delete product");
        }
    }

    return (
        <>
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                <p className="text-sm text-muted">
                    {products.length} {products.length === 1 ? "product" : "products"} {search && `matching “${search}”`}
                </p>
                <Button onClick={openCreate} className="shrink-0">
                    <PlusIcon width={15} height={15} />
                    New Product
                </Button>
            </div>

            {error && (
                <div className="border-b border-border px-4 py-2 text-sm text-danger">{error}</div>
            )}

            {loading ? (
                <p className="px-4 py-10 text-center text-sm text-muted">Loading products…</p>
            ) : products.length > 0 ? (
                <div className="scroll-thin overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted uppercase">
                                <th className="px-4 py-2.5 font-medium">Product</th>
                                <th className="px-4 py-2.5 font-medium">Category</th>
                                <th className="px-4 py-2.5 text-right font-medium">Cost</th>
                                <th className="px-4 py-2.5 text-right font-medium">Price</th>
                                <th className="px-4 py-2.5 text-right font-medium">Stock</th>
                                <th className="px-4 py-2.5 font-medium">Status</th>
                                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-surface-alt">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Thumb src={product.image} />
                                            <div>
                                                <p className="font-medium text-foreground">{product.name}</p>
                                                <p className="text-xs text-muted">{product.barcode ?? "No barcode"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted">{product.category_name ?? "Uncategorised"}</td>
                                    <td className="px-4 py-3 text-right text-muted">{money(product.cost_price, symbol)}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-foreground">{money(product.selling_price, symbol)}</td>
                                    <td className="px-4 py-3 text-right">
                                        {toNumber(product.stock_quantity)} {product.unit}
                                    </td>
                                    <td className="px-4 py-3">
                                        {!product.is_active ? (
                                            <Badge tone="neutral">Inactive</Badge>
                                        ) : toNumber(product.stock_quantity) <= toNumber(product.min_stock) ? (
                                            <Badge tone="danger">Low stock</Badge>
                                        ) : (
                                            <Badge tone="success">In stock</Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button tone="outline" size="sm" onClick={() => openEdit(product)}>
                                                Edit
                                            </Button>
                                            <Button
                                                tone="ghost"
                                                size="sm"
                                                className="text-muted hover:text-danger"
                                                aria-label={`Delete ${product.name}`}
                                                onClick={() => remove(product)}
                                            >
                                                <TrashIcon width={14} height={14} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="px-4 py-14 text-center">
                    <BoxIcon width={36} height={36} className="mx-auto mb-3 text-faint" />
                    <p className="font-medium text-foreground">
                        {search ? `No products match “${search}”` : "No products yet"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                        {search
                            ? "Try a different name, barcode or item code."
                            : "Add products to the database to see them listed here."}
                    </p>
                    <Button className="mt-4" onClick={openCreate}>
                        <PlusIcon width={15} height={15} />
                        Add first product
                    </Button>
                </div>
            )}

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card border border-border bg-surface shadow-card">
                        <header className="flex items-center justify-between border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">
                                {editing ? `Edit ${editing.name}` : "New product"}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-lg p-1.5 text-muted hover:bg-surface-alt hover:text-foreground"
                                aria-label="Close"
                            >
                                <CloseIcon width={16} height={16} />
                            </button>
                        </header>

                        <form onSubmit={save} className="grid grid-cols-2 gap-4 px-5 py-5">
                            {error && (
                                <p className="col-span-2 text-sm text-danger">{error}</p>
                            )}

                            <div className="col-span-2">
                                <Field label="Product name">
                                    <Input
                                        value={form.name}
                                        required
                                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                                    />
                                </Field>
                            </div>

                            <div className="col-span-2">
                                <Field label="Product image">
                                    <div className="flex items-center gap-4">
                                    <Thumb src={form.image || null} className="h-16 w-16" />
                                    <div className="flex flex-col gap-2">
                                        <label className="inline-flex cursor-pointer">
                                            <span className="inline-flex items-center gap-2 rounded-md border border-border-strong px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt">
                                                <PlusIcon width={14} height={14} />
                                                Choose image
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(event) => {
                                                    void pickImage(event.target.files?.[0]);
                                                    event.target.value = "";
                                                }}
                                            />
                                        </label>
                                        {form.image ? (
                                            <Button
                                                tone="ghost"
                                                size="sm"
                                                className="justify-start px-0 text-danger"
                                                onClick={() => setForm({ ...form, image: "" })}
                                            >
                                                Remove image
                                            </Button>
                                        ) : (
                                            <p className="text-xs text-faint">JPG or PNG, displayed as a thumbnail in the catalogue and POS.</p>
                                        )}
                                    </div>
                                </div>
                            </Field>
                            </div>

                            <Field label="Barcode">
                                <Input
                                    value={form.barcode}
                                    onChange={(event) => setForm({ ...form, barcode: event.target.value })}
                                />
                            </Field>
                            <Field label="Item code">
                                <Input
                                    value={form.item_code}
                                    onChange={(event) => setForm({ ...form, item_code: event.target.value })}
                                />
                            </Field>
                            <Field label="Category">
                                <Select
                                    value={form.category_id}
                                    onChange={(event) => setForm({ ...form, category_id: event.target.value })}
                                >
                                    <option value="">None</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                            <Field label="Supplier">
                                <Select
                                    value={form.supplier_id}
                                    onChange={(event) => setForm({ ...form, supplier_id: event.target.value })}
                                >
                                    <option value="">None</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                            <Field label="Cost price">
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.cost_price}
                                    onChange={(event) => setForm({ ...form, cost_price: event.target.value })}
                                />
                            </Field>
                            <Field label="Selling price">
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={form.selling_price}
                                    onChange={(event) => setForm({ ...form, selling_price: event.target.value })}
                                />
                            </Field>
                            <Field label="Stock quantity">
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.stock_quantity}
                                    onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })}
                                />
                            </Field>
                            <Field label="Min stock">
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.min_stock}
                                    onChange={(event) => setForm({ ...form, min_stock: event.target.value })}
                                />
                            </Field>
                            <Field label="Unit">
                                <Input
                                    value={form.unit}
                                    onChange={(event) => setForm({ ...form, unit: event.target.value })}
                                />
                            </Field>
                            <Field label="Active">
                                <label className="flex items-center gap-2 py-2 text-sm text-foreground">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                                        className="h-4 w-4 accent-primary"
                                    />
                                    Visible & sellable in the POS
                                </label>
                            </Field>

                            <div className="col-span-2 flex items-center justify-end gap-2 border-t border-border pt-4">
                                <Button tone="outline" type="button" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" loading={saving}>
                                    {editing ? "Save changes" : "Add product"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}