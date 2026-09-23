import { sql } from "@/lib/neon";
import { toNumber } from "@/lib/format";

/**
 * Server-side data access for the UI.
 *
 * Every helper returns a discriminated result instead of throwing, so a page can
 * still render (with a clear "database not connected" panel) when DATABASE_URL is
 * missing or Neon is unreachable.
 */

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

const str = (value: unknown, fallback = ""): string =>
    value === null || value === undefined ? fallback : String(value);

const strOrNull = (value: unknown): string | null =>
    value === null || value === undefined ? null : String(value);

async function safe<T>(run: () => Promise<T>): Promise<Result<T>> {
    try {
        return { ok: true, data: await run() };
    } catch (error) {
        return { ok: false, error: errorMessage(error) };
    }
}

export const DEFAULT_SETTINGS = {
    store_name: "KINGTEWOS TRADING",
    currency_symbol: "Br",
    tax_rate: "10",
    store_address: "123 Main Street",
    store_phone: "0123456789",
} as const;

export type Settings = Record<string, string>;

export type ProductRow = {
    id: number;
    name: string;
    barcode: string | null;
    category_id: number | null;
    category_name: string | null;
    supplier_id: number | null;
    selling_price: number;
    cost_price: number;
    stock_quantity: number;
    min_stock: number;
    unit: string;
    is_active: boolean;
    image: string | null;
};

export type OrderRow = {
    id: number;
    order_number: string;
    customer_name: string;
    user_name: string | null;
    store_name: string | null;
    subtotal: number;
    total: number;
    payment_method: string;
    status: string;
    created_at: string;
};

export type StockRow = {
    id: number;
    name: string;
    unit: string;
    stock_quantity: number;
    min_stock: number;
    stock_value: number;
    is_low: boolean;
};

export type DashboardData = {
    revenueToday: number;
    ordersToday: number;
    productCount: number;
    stockUnits: number;
    stockValue: number;
    lowStockCount: number;
    recentOrders: {
        id: number;
        order_number: string;
        customer_name: string;
        total: number;
        payment_method: string;
        status: string;
        created_at: string;
    }[];
    topProducts: { product_name: string; qty: number; revenue: number }[];
    salesByDay: { day: string; total: number }[];
    lowStock: { id: number; name: string; stock_quantity: number; min_stock: number; unit: string }[];
};

export const db = {
    async settings(): Promise<Result<Settings>> {
        return safe(async () => {
            const rows = await sql`SELECT setting_key, setting_value FROM settings`;
            const settings: Settings = {};
            for (const row of rows) settings[str(row.setting_key)] = str(row.setting_value);
            return settings;
        });
    },

    async dashboard(): Promise<Result<DashboardData>> {
        return safe(async () => {
            const [today, inventory, lowStockCount, recentOrders, topProducts, salesByDay, lowStock] =
                await Promise.all([
                    sql`SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders
                        FROM orders
                        WHERE created_at >= date_trunc('day', now())`,
                    sql`SELECT COUNT(*) AS products,
                               COALESCE(SUM(stock_quantity), 0) AS units,
                               COALESCE(SUM(stock_quantity * cost_price), 0) AS stock_value
                        FROM products
                        WHERE is_active = TRUE`,
                    sql`SELECT COUNT(*) AS low_stock
                        FROM products
                        WHERE is_active = TRUE AND stock_quantity <= min_stock`,
                    sql`SELECT o.id, o.order_number, o.customer_name, o.total,
                               o.payment_method, o.status, o.created_at
                        FROM orders o
                        ORDER BY o.created_at DESC
                        LIMIT 6`,
                    sql`SELECT oi.product_name,
                               COALESCE(SUM(oi.quantity), 0) AS qty,
                               COALESCE(SUM(oi.subtotal), 0) AS revenue
                        FROM order_items oi
                        GROUP BY oi.product_name
                        ORDER BY revenue DESC
                        LIMIT 5`,
                    sql`SELECT to_char(date_trunc('day', created_at), 'Dy') AS day,
                               date_trunc('day', created_at) AS bucket,
                               COALESCE(SUM(total), 0) AS total
                        FROM orders
                        WHERE created_at >= date_trunc('day', now()) - interval '6 days'
                        GROUP BY 1, 2
                        ORDER BY 2`,
                    sql`SELECT p.id, p.name, p.stock_quantity, p.min_stock, p.unit
                        FROM products p
                        WHERE p.is_active = TRUE AND p.stock_quantity <= p.min_stock
                        ORDER BY (p.stock_quantity - p.min_stock) ASC
                        LIMIT 6`,
                ]);

            return {
                revenueToday: toNumber(today[0]?.revenue),
                ordersToday: toNumber(today[0]?.orders),
                productCount: toNumber(inventory[0]?.products),
                stockUnits: toNumber(inventory[0]?.units),
                stockValue: toNumber(inventory[0]?.stock_value),
                lowStockCount: toNumber(lowStockCount[0]?.low_stock),
                recentOrders: recentOrders.map((row) => ({
                    id: toNumber(row.id),
                    order_number: str(row.order_number),
                    customer_name: str(row.customer_name, "Walk-in Customer"),
                    total: toNumber(row.total),
                    payment_method: str(row.payment_method, "cash"),
                    status: str(row.status, "completed"),
                    created_at: str(row.created_at),
                })),
                topProducts: topProducts.map((row) => ({
                    product_name: str(row.product_name),
                    qty: toNumber(row.qty),
                    revenue: toNumber(row.revenue),
                })),
                salesByDay: salesByDay.map((row) => ({
                    day: str(row.day),
                    total: toNumber(row.total),
                })),
                lowStock: lowStock.map((row) => ({
                    id: toNumber(row.id),
                    name: str(row.name),
                    stock_quantity: toNumber(row.stock_quantity),
                    min_stock: toNumber(row.min_stock),
                    unit: str(row.unit, "pcs"),
                })),
            };
        });
    },

    async products(search?: string): Promise<Result<ProductRow[]>> {
        return safe(async () => {
            const params: unknown[] = [];
            let where = "";
            if (search) {
                where = "WHERE (p.name ILIKE $1 OR p.barcode ILIKE $1 OR p.item_code ILIKE $1)";
                params.push(`%${search}%`);
            }
            params.push(200);
            const rows = await sql(
                `SELECT p.id, p.name, p.barcode, p.selling_price, p.cost_price,
                        p.stock_quantity, p.min_stock, p.unit, p.is_active, p.image,
                        p.category_id, p.supplier_id,
                        c.name AS category_name
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id
                 ${where}
                 ORDER BY p.name ASC
                 LIMIT $${params.length}`,
                ...params,
            );

            return rows.map((row) => ({
                id: toNumber(row.id),
                name: str(row.name),
                barcode: strOrNull(row.barcode),
                category_id: row.category_id == null ? null : toNumber(row.category_id),
                category_name: strOrNull(row.category_name),
                supplier_id: row.supplier_id == null ? null : toNumber(row.supplier_id),
                selling_price: toNumber(row.selling_price),
                cost_price: toNumber(row.cost_price),
                stock_quantity: toNumber(row.stock_quantity),
                min_stock: toNumber(row.min_stock),
                unit: str(row.unit, "pcs"),
                is_active: Boolean(row.is_active),
                image: strOrNull(row.image),
            }));
        });
    },

    async orders(status?: string): Promise<Result<OrderRow[]>> {
        return safe(async () => {
            const params: unknown[] = [];
            let where = "";
            if (status) {
                where = "WHERE o.status = $1";
                params.push(status);
            }
            params.push(50);
            const rows = await sql(
                `SELECT o.id, o.order_number, o.customer_name, o.subtotal, o.total,
                        o.payment_method, o.status, o.created_at,
                        u.full_name AS user_name, s.name AS store_name
                 FROM orders o
                 LEFT JOIN users u ON o.user_id = u.id
                 LEFT JOIN stores s ON o.store_id = s.id
                 ${where}
                 ORDER BY o.created_at DESC
                 LIMIT $${params.length}`,
                ...params,
            );

            return rows.map((row) => ({
                id: toNumber(row.id),
                order_number: str(row.order_number),
                customer_name: str(row.customer_name, "Walk-in Customer"),
                user_name: strOrNull(row.user_name),
                store_name: strOrNull(row.store_name),
                subtotal: toNumber(row.subtotal),
                total: toNumber(row.total),
                payment_method: str(row.payment_method, "cash"),
                status: str(row.status, "completed"),
                created_at: str(row.created_at),
            }));
        });
    },

    async stock(lowOnly = false): Promise<Result<StockRow[]>> {
        return safe(async () => {
            const rows = await sql(
                `SELECT p.id, p.name, p.unit, p.stock_quantity, p.min_stock,
                        (p.stock_quantity * p.cost_price) AS stock_value
                 FROM products p
                 WHERE p.is_active = TRUE${lowOnly ? " AND p.stock_quantity <= p.min_stock" : ""}
                 ORDER BY p.stock_quantity ASC
                 LIMIT 200`,
            );

            return rows.map((row) => {
                const quantity = toNumber(row.stock_quantity);
                const min = toNumber(row.min_stock);
                return {
                    id: toNumber(row.id),
                    name: str(row.name),
                    unit: str(row.unit, "pcs"),
                    stock_quantity: quantity,
                    min_stock: min,
                    stock_value: toNumber(row.stock_value),
                    is_low: quantity <= min,
                };
            });
        });
    },
};

export function currencySymbol(settings: Settings | undefined): string {
    return settings?.currency_symbol || DEFAULT_SETTINGS.currency_symbol;
}

export function taxRate(settings: Settings | undefined): number {
    return toNumber(settings?.tax_rate ?? DEFAULT_SETTINGS.tax_rate);
}

/* ------------------------------------------------------------------ *
 * Extra readers used by the reference-style screens.
 * ------------------------------------------------------------------ */

export const dbExtra = {
    async monthlySales(): Promise<Result<number>> {
        return safe(async () => {
            const rows = await sql`SELECT COALESCE(SUM(total), 0) AS revenue
                                   FROM orders
                                   WHERE created_at >= date_trunc('month', now())`;
            return toNumber(rows[0]?.revenue);
        });
    },

    async categories(): Promise<
        Result<{ id: number; name: string; description: string | null; is_active: boolean; products: number }[]>
    > {
        return safe(async () => {
            const rows = await sql`SELECT c.id, c.name, c.description, c.is_active,
                                          (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS products
                                   FROM categories c
                                   ORDER BY c.name ASC`;
            return rows.map((row) => ({
                id: toNumber(row.id),
                name: str(row.name),
                description: strOrNull(row.description),
                is_active: Boolean(row.is_active),
                products: toNumber(row.products),
            }));
        });
    },

    async suppliers(): Promise<
        Result<{ id: number; name: string; contact_person: string | null; phone: string | null; email: string | null; products: number }[]>
    > {
        return safe(async () => {
            const rows = await sql`SELECT s.id, s.name, s.contact_person, s.phone, s.email,
                                          (SELECT COUNT(*) FROM products p WHERE p.supplier_id = s.id) AS products
                                   FROM suppliers s
                                   ORDER BY s.name ASC`;
            return rows.map((row) => ({
                id: toNumber(row.id),
                name: str(row.name),
                contact_person: strOrNull(row.contact_person),
                phone: strOrNull(row.phone),
                email: strOrNull(row.email),
                products: toNumber(row.products),
            }));
        });
    },

    async customers(): Promise<
        Result<{ id: number; full_name: string; username: string; email: string | null; phone: string | null; role: string; is_active: boolean }[]>
    > {
        return safe(async () => {
            const rows = await sql`SELECT id, full_name, username, email, phone, role, is_active
                                   FROM users
                                   ORDER BY full_name ASC`;
            return rows.map((row) => ({
                id: toNumber(row.id),
                full_name: str(row.full_name),
                username: str(row.username),
                email: strOrNull(row.email),
                phone: strOrNull(row.phone),
                role: str(row.role),
                is_active: Boolean(row.is_active),
            }));
        });
    },

    async stockMovements(): Promise<
        Result<{ id: number; product_name: string; movement_type: string; quantity: number; reference: string | null; created_at: string }[]>
    > {
        return safe(async () => {
            const rows = await sql`SELECT m.id, m.movement_type, m.quantity, m.reference, m.created_at,
                                          p.name AS product_name
                                   FROM stock_movements m
                                   LEFT JOIN products p ON m.product_id = p.id
                                   ORDER BY m.created_at DESC
                                   LIMIT 50`;
            return rows.map((row) => ({
                id: toNumber(row.id),
                product_name: str(row.product_name),
                movement_type: str(row.movement_type),
                quantity: toNumber(row.quantity),
                reference: strOrNull(row.reference),
                created_at: str(row.created_at),
            }));
        });
    },

    async transfers(): Promise<
        Result<{ id: number; reference: string; from_store: string | null; to_store: string | null; status: string; total_items: number; total_value: number; created_at: string }[]>
    > {
        return safe(async () => {
            const rows = await sql`SELECT t.id, t.reference, t.status, t.total_items, t.total_value, t.created_at,
                                          s1.name AS from_store, s2.name AS to_store
                                   FROM store_transfers t
                                   LEFT JOIN stores s1 ON t.from_store_id = s1.id
                                   LEFT JOIN stores s2 ON t.to_store_id = s2.id
                                   ORDER BY t.created_at DESC
                                   LIMIT 50`;
            return rows.map((row) => ({
                id: toNumber(row.id),
                reference: str(row.reference),
                from_store: strOrNull(row.from_store),
                to_store: strOrNull(row.to_store),
                status: str(row.status),
                total_items: toNumber(row.total_items),
                total_value: toNumber(row.total_value),
                created_at: str(row.created_at),
            }));
        });
    },

    async reports(): Promise<
        Result<{
            daily: { day: string; orders: number; revenue: number }[];
            payments: { method: string; orders: number; revenue: number }[];
        }>
    > {
        return safe(async () => {
            const [daily, payments] = await Promise.all([
                sql`SELECT to_char(date_trunc('day', created_at), 'Mon DD') AS day,
                           date_trunc('day', created_at) AS bucket,
                           COUNT(*) AS orders,
                           COALESCE(SUM(total), 0) AS revenue
                    FROM orders
                    WHERE created_at >= date_trunc('day', now()) - interval '13 days'
                    GROUP BY 1, 2
                    ORDER BY 2 DESC
                    LIMIT 14`,
                sql`SELECT payment_method AS method, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
                    FROM orders
                    GROUP BY payment_method
                    ORDER BY revenue DESC`,
            ]);
            return {
                daily: daily.map((row) => ({
                    day: str(row.day),
                    orders: toNumber(row.orders),
                    revenue: toNumber(row.revenue),
                })),
                payments: payments.map((row) => ({
                    method: str(row.method, "cash"),
                    orders: toNumber(row.orders),
                    revenue: toNumber(row.revenue),
                })),
            };
        });
    },
};
