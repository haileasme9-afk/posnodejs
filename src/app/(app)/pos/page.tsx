'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/use-auth';
import { Button, Card, Input, Modal, Loader, Select, Field, Badge, cn } from '@/components/ui';
import { money, num } from '@/lib/format';

interface Product {
    id: number;
    name: string;
    barcode: string | null;
    item_code: string | null;
    category_name: string | null;
    selling_price: number | string;
    cost_price: number | string;
    stock_quantity: number;
    unit: string;
}

interface Customer {
    id: number;
    name: string;
    phone: string | null;
}

interface CartItem {
    product_id: number;
    name: string;
    barcode: string | null;
    quantity: number;
    unit_price: number;
    stock_quantity: number;
}

interface HeldOrder {
    id: number;
    customer_name: string | null;
    cart_data: string;
    subtotal: number;
    total: number;
    held_at: string;
}

interface SaleResult {
    id: number;
    order_number: string;
    invoice_number: string | null;
    fs_number: string | null;
    total: number;
    change_amount: number;
    amount_paid: number;
}

export default function PosPage() {
    const { loading: authLoading } = useAuth();
    const [q, setQ] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerId, setCustomerId] = useState<string>('');
    const [customerName, setCustomerName] = useState('');
    const [discountPct, setDiscountPct] = useState('0');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [taxRate, setTaxRate] = useState(10);
    const [searching, setSearching] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [sale, setSale] = useState<SaleResult | null>(null);
    const [held, setHeld] = useState<HeldOrder[]>([]);
    const [showHeld, setShowHeld] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const searchProducts = useCallback(async (query: string) => {
        setLoadingProducts(true);
        try {
            const data = await api.get<Product[]>('/api/products?limit=60' + (query ? `&q=${encodeURIComponent(query)}` : ''));
            setProducts(data);
        } catch {
            /* api helper redirects on 401 */
        } finally {
            setLoadingProducts(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;
        searchProducts('');
        api.get<Customer[]>('/api/customers?active_only=1').then((d) => setCustomers(d)).catch(() => {});
        api.post<{ tax_rate: number }>('/api/orders', { action: 'next_codes' }).then((d) => setTaxRate(num(d.tax_rate))).catch(() => {});
    }, [authLoading, searchProducts]);

    useEffect(() => {
        const t = setTimeout(() => searchProducts(q), 250);
        return () => clearTimeout(t);
    }, [q, searchProducts]);

    function addToCart(p: Product) {
        setCart((prev) => {
            const idx = prev.findIndex((i) => i.product_id === p.id);
            if (idx >= 0) {
                const next = [...prev];
                if (next[idx].quantity < p.stock_quantity) next[idx].quantity += 1;
                return next;
            }
            return [...prev, { product_id: p.id, name: p.name, barcode: p.barcode, quantity: 1, unit_price: num(p.selling_price), stock_quantity: p.stock_quantity }];
        });
    }

    function setQty(productId: number, qty: number) {
        setCart((prev) => prev.map((i) => (i.product_id === productId ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock_quantity)) } : i)));
    }

    function removeItem(productId: number) {
        setCart((prev) => prev.filter((i) => i.product_id !== productId));
    }

    const subtotal = useMemo(() => cart.reduce((s, i) => s + i.unit_price * i.quantity, 0), [cart]);
    const taxAmount = (subtotal * taxRate) / 100;
    const discountValue = (subtotal * num(discountPct)) / 100;
    const total = subtotal + taxAmount - discountValue;
    const paid = paymentMethod === 'cash' ? num(amountPaid) : total;
    const changeAmount = paymentMethod === 'cash' ? Math.max(0, paid - total) : 0;

    async function checkout() {
        if (cart.length === 0) return;
        setCheckingOut(true);
        setError(null);
        try {
            const result = await api.post<SaleResult>('/api/orders', {
                action: 'create',
                customer_id: customerId ? Number(customerId) : null,
                customer_name: customerName || undefined,
                items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
                discount: num(discountPct),
                payment_method: paymentMethod,
                amount_paid: paid,
            });
            setSale(result);
            setAmountPaid('');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setCheckingOut(false);
        }
    }

    function resetCart() {
        setCart([]);
        setCustomerId('');
        setDiscountPct('0');
        setPaymentMethod('cash');
        setAmountPaid('');
    }

    async function holdOrder() {
        if (cart.length === 0) return;
        try {
            await api.post('/api/held-orders', {
                action: 'hold',
                customer_id: customerId ? Number(customerId) : null,
                customer_name: customerName || undefined,
                cart_data: { customer_id: customerId || null, customer_name: customerName, items: cart },
                subtotal,
                tax_amount: taxAmount,
                discount: discountValue,
                total,
            });
            setSuccess('Order held successfully.');
            resetCart();
            setTimeout(() => setSuccess(null), 2500);
        } catch (e: any) {
            setError(e.message);
        }
    }

    async function loadHeld() {
        try {
            const data = await api.get<HeldOrder[]>('/api/held-orders');
            setHeld(data);
            setShowHeld(true);
        } catch (e: any) {
            setError(e.message);
        }
    }

    function restoreHeld(order: HeldOrder) {
        try {
            const parsed = JSON.parse(order.cart_data);
            const items: CartItem[] = Array.isArray(parsed.items) ? parsed.items : [];
            setCart(items);
            setCustomerId(String(parsed.customer_id || ''));
            setCustomerName(parsed.customer_name || '');
            setShowHeld(false);
        } catch {
            setError('Could not restore held order');
        }
    }

    async function deleteHeld(id: number) {
        await api.post('/api/held-orders', { action: 'delete', id });
        setHeld((prev) => prev.filter((h) => h.id !== id));
    }

    if (authLoading) return <Loader />;

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        className="max-w-sm"
                        placeholder="Search product by name or barcode..."
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            setSearching(true);
                        }}
                        onBlur={() => setSearching(false)}
                    />
                    <Button variant="secondary" onClick={() => loadHeld()}>
                        Held Orders ({held.length || 0})
                    </Button>
                    <Button variant="secondary" onClick={() => holdOrder()}>Hold Cart</Button>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}

                {(q.trim().length > 0 && searching) || loadingProducts ? (
                    <Loader label="Searching..." />
                ) : products.length === 0 && !loadingProducts ? (
                    <Card><p className="py-10 text-center text-sm text-zinc-400">No products found.</p></Card>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {products.map((p) => {
                            const out = p.stock_quantity <= 0;
                            const inCart = cart.find((c) => c.product_id === p.id);
                            return (
                                <button
                                    key={p.id}
                                    disabled={out}
                                    onClick={() => addToCart(p)}
                                    className={cn(
                                        'rounded-xl border p-3 text-left transition-colors',
                                        out
                                            ? 'cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-50 dark:border-zinc-700 dark:bg-zinc-900'
                                            : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500',
                                    )}
                                >
                                    <p className="line-clamp-2 min-h-10 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{p.name}</p>
                                    <p className="mt-1 text-xs text-zinc-400">{p.category_name || 'General'}</p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{money(p.selling_price)}</span>
                                        {inCart && <Badge tone="blue">x{inCart.quantity}</Badge>}
                                        {out && <Badge tone="red">Out</Badge>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <Card title={`Cart (${cart.reduce((s, i) => s + i.quantity, 0)} items)`} className="lg:sticky lg:top-20">
                <div className="space-y-4">
                    {cart.length === 0 ? (
                        <p className="py-8 text-center text-sm text-zinc-400">Cart is empty. Tap a product to add.</p>
                    ) : (
                        <div className="max-h-72 space-y-2 overflow-auto">
                            {cart.map((i) => (
                                <div key={i.product_id} className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{i.name}</p>
                                        <p className="text-xs text-zinc-400">{money(i.unit_price)} each</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="secondary" className="h-7 w-7 px-0" onClick={() => setQty(i.product_id, i.quantity - 1)}>-</Button>
                                        <span className="w-8 text-center text-sm">{i.quantity}</span>
                                        <Button variant="secondary" className="h-7 w-7 px-0" onClick={() => setQty(i.product_id, i.quantity + 1)}>+</Button>
                                    </div>
                                    <span className="w-20 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">{money(i.unit_price * i.quantity)}</span>
                                    <button onClick={() => removeItem(i.product_id)} className="text-zinc-400 hover:text-red-600">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Customer">
                            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                                <option value="">Walk-in</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Customer Name (custom)">
                            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional" />
                        </Field>
                        <Field label={`Discount % (${money(discountValue)})`}>
                            <Input type="number" min="0" max="100" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} />
                        </Field>
                        <Field label="Payment Method">
                            <Select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); if (e.target.value === 'cash') setAmountPaid(String(total || '')); }}>
                                <option value="cash">Cash</option>
                                <option value="mobile">Mobile Money</option>
                                <option value="card">Card</option>
                            </Select>
                        </Field>
                    </div>

                    <div className="space-y-1 border-t border-zinc-200 pt-3 text-sm dark:border-zinc-700">
                        <div className="flex justify-between text-zinc-500 dark:text-zinc-400"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                        <div className="flex justify-between text-zinc-500 dark:text-zinc-400"><span>Tax ({taxRate}%)</span><span>{money(taxAmount)}</span></div>
                        <div className="flex justify-between text-zinc-500 dark:text-zinc-400"><span>Discount</span><span>-{money(discountValue)}</span></div>
                        <div className="flex justify-between text-lg font-bold text-zinc-900 dark:text-zinc-50"><span>Total</span><span>{money(total)}</span></div>
                        {paymentMethod === 'cash' && (
                            <>
                                <Field label="Cash Received">
                                    <Input type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
                                </Field>
                                <div className="flex justify-between text-green-600"><span>Change</span><span>{money(changeAmount)}</span></div>
                            </>
                        )}
                    </div>

                    <Button className="w-full py-3 text-base" disabled={cart.length === 0} loading={checkingOut} onClick={checkout}>
                        Charge {money(total)}
                    </Button>
                </div>
            </Card>

            <Modal open={!!sale} onClose={() => { setSale(null); resetCart(); }} title="Sale Completed" >
                {sale && (
                    <div className="space-y-3">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Order <span className="font-semibold text-zinc-900 dark:text-zinc-50">{sale.order_number}</span></p>
                        <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-800">
                            <p className="text-3xl font-bold text-green-600">{money(sale.total)}</p>
                            {sale.change_amount > 0 && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Change: {money(sale.change_amount)}</p>}
                        </div>
                        <dl className="space-y-1 text-sm">
                            <div className="flex justify-between"><dt className="text-zinc-500">Invoice No</dt><dd className="font-medium">{sale.invoice_number || '-'}</dd></div>
                            <div className="flex justify-between"><dt className="text-zinc-500">FS No</dt><dd className="font-medium">{sale.fs_number || '-'}</dd></div>
                            <div className="flex justify-between"><dt className="text-zinc-500">Paid</dt><dd className="font-medium">{money(sale.amount_paid)}</dd></div>
                        </dl>
                        <Button className="w-full" onClick={() => window.print()}>Print Receipt</Button>
                    </div>
                )}
            </Modal>

            <Modal open={showHeld} onClose={() => setShowHeld(false)} title="Held Orders" wide>
                {held.length === 0 ? (
                    <p className="py-8 text-center text-sm text-zinc-400">No held orders.</p>
                ) : (
                    <div className="space-y-2">
                        {held.map((h) => (
                            <div key={h.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                                <div>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{h.customer_name || 'Walk-in'}</p>
                                    <p className="text-xs text-zinc-400">#{h.id} · Total {money(h.total)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => restoreHeld(h)}>Restore</Button>
                                    <Button variant="danger" onClick={() => deleteHeld(h.id)}>Delete</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}