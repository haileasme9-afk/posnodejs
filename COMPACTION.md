# POS Next.js — Project Compaction

Port of the PHP POS system (`C:\xampp\htdocs\pos-system`) into a Next.js App Router project, backed by Neon (PostgreSQL), deployed on Vercel.

## Stack

- **Framework:** Next.js 16.3.5 (Turbopack default, App Router), React 19.2, TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Neon PostgreSQL (`@neondatabase/serverless` HTTP driver)
- **Auth:** HMAC-SHA256 signed cookie session (`pos_session`, `SESSION_SECRET` env)
- **Passwords:** bcryptjs (auto-upgrade of legacy plaintext on login)
- **Hosting:** Vercel — project `asmat1/pos-nextjs`, prod `https://pos-nextjs-three.vercel.app`

## Key conventions for this repo (Next.js 16)

- `cookies()` is async. `middleware` convention deprecated → auth is enforced in layouts + API routes.
- tsconfig path alias `"@/*"` maps to project **root** (lib/, components/ live at root, not under `src/`).
- API routes in `src/app/api/*`, pages in `src/app/*`.
- Layout components are **named** exports (`Header`, `Sidebar`, `Footer`, `MobileMenu`).
- The DB client is **lazy** so production builds don't need `DATABASE_URL` at build time.

## Repository layout

```
.
├── schema.sql            # Full PostgreSQL schema + seeds (source of truth)
├── scripts/migrate.mjs   # Applies schema + bcrypt-hashes plaintext seed passwords
├── lib/
│   ├── neon.ts           # lazy neon() client + sql() / transaction() helpers
│   ├── auth.ts           # getSession/setSession/destroySession, requireUser/requirePermission, PAGE_KEYS
│   └── helpers.ts        # num, formatMoney, formatDate, numberToWords/amountToWords, getSettings,
│                         #   getNextInvoiceNumber (CA-XXXXXXXX), getNextFsNumber, generateOrderNumber,
│                         #   generateBarcode, slugify, toPgRule
├── components/           # header / sidebar / footer / mobile-menu (named exports)
├── scripts/migrate.mjs
└── src/app/
    ├── layout.tsx        # root layout (references the 4 components; className not class)
    ├── page.tsx          # default create-next-app page (to be replaced by dashboard)
    └── api/
        ├── auth/         # POST login (bcrypt), GET me, DELETE logout
        ├── dashboard/    # today/month/yesterday sales, order counts, low stock, recent orders
        ├── categories/   # CRUD
        ├── suppliers/    # CRUD
        ├── customers/    # CRUD (customers table)
        ├── users/        # CRUD (admin only, bcrypt hashing)
        ├── products/     # CRUD + category/supplier joins + barcode gen
        ├── orders/       # POST create (transactional checkout), refund, next_codes; GET list/detail
        ├── receiving/    # GRN create (transactional) + list/detail
        ├── transfers/    # create / complete / cancel / delete + list/detail
        ├── stock/        # stock levels + movements + manual adjustment
        └── settings/     # key/value get/set  (permission guard TODO)
```

## Database (16 tables)

Base: `users`, `categories`, `suppliers`, `stores`, `products`, `stock_movements`, `orders`, `order_items`, `store_transfers`, `store_transfer_items`, `settings`.
Extended (ported): `customers`, `stock_receivings`, `stock_receiving_items`, `roles`, `permissions`, `licenses`, `held_orders`, `cash_sessions`, `audit_log`, `orders.cash_session_id` (ALTER), product stock `CHECK (stock_quantity >= 0)` (enforces the checkout stock guard).

Key numeric generation: invoice `CA-XXXXXXXX`, FS `00000000`, order number `ORDyyyymmddNNNN`, transfer `TRFyyyymmddNNNN`, receiving `RCV-yyyymmddHHMMSS`. Counters live in `settings` (e.g. `invoice_number_next`, `fs_number_next`).

## Auth & permissions

- Login: lookup by username (active), `bcrypt.compare` with plaintext fallback, auto-hash upgrade, HMAC cookie session.
- Role → page access (`PAGE_KEYS`):
  - **admin:** all
  - **manager:** all except `users`
  - **cashier:** `dashboard, pos, products, orders, stock, customers`
- Seed users: `admin/admin123`, `cashier/cashier123` (bcrypt-hashed at migration).

## Checkout flow (orders POST, transaction)

1. Validate items, products exist + active.
2. Compute subtotal from server-side selling prices; tax from `settings.tax_rate` (default 10).
3. Generate order/invoice/FS numbers (consume counters).
4. `sql.transaction`: insert order → insert `order_items` (order_id resolved via `order_number` subquery) → decrement stock → insert `stock_movements`. Stock guard = CHECK constraint; insufficient stock aborts the whole transaction.
5. Refund (action `refund`): status → `refunded`, restores stock, `stock_movements` `'in'`.

## Progress

- [x] Git init/push (`main`, commits `eeb522d`, `90534bd`, `affd594`)
- [x] Schema extended + migrated to Neon (verified via `/api/...`)
- [x] All business APIs (auth, dashboard, categories, suppliers, customers, users, products, orders, receiving, transfers, stock, settings)
- [x] Production deploy on Vercel (`/api/products` verified)
- [ ] Tailwind v4 `globals.css` (`@import "tailwindcss";`), app shell (`(app)` route group + sidebar), `ui.tsx` + client `apiFetch`
- [ ] Pages: login, dashboard, POS, products, categories, suppliers, customers, orders, receiving, transfers, held-orders, stock, reports, users, settings
- [ ] Add `SESSION_SECRET` to Vercel env, rebuild, redeploy

## Out of scope (per original decision)

- Payment gateways (mobile money) — cash only via `payment_method`.
- Licensing system — `licenses` table reserved, unused.
- Thermal / A4 window printer — browser native print only (receipt pages).
- PHP hardcoded 15% tax treated as a bug; Next.js uses `settings.tax_rate`.

## Local dev notes

- Port 3000 is occupied on this machine → run local server on port `3010`.
- Deploy via CLI: `npx vercel deploy --prod --token <VERCEL_TOKEN>` (git auto-link to Vercel failed).
- `.env.local` holds `DATABASE_URL`, `NEXT_PUBLIC_SITE_NAME`, `CURRENCY`; `SESSION_SECRET` pending for prod.
- DB migrate: `node scripts/migrate.mjs` with `DATABASE_URL` set.