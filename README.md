# POS System (Next.js)

Point-of-sale front end and REST API built with Next.js 16 (App Router), Tailwind CSS v4 and
Neon Postgres.

## Getting started

```bash
npm install
npm run migrate              # applies schema.sql + seed data
npm run dev                  # http://localhost:3000
```

Create `.env.local` in the project root with a single variable (the file is git-ignored):

```
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
```

Every page degrades gracefully without it — the UI renders with a "Database not connected"
panel instead of crashing.

## Screens

| Route       | What it does                                                            |
| ----------- | ----------------------------------------------------------------------- |
| `/`         | Dashboard: today's revenue, orders, stock value, 7-day sales, low stock |
| `/pos`      | Register: product grid, cart, tax, payment method, sale completion       |
| `/products` | Catalogue with name/barcode/item-code search                             |
| `/stock`    | Inventory levels, restock filter, stock value                            |
| `/orders`   | Order history with status filter and revenue summary                     |
| `/settings` | Store profile, currency and tax defaults from the `settings` table       |

## API

`/api/products`, `/api/orders`, `/api/stock`, `/api/customers`, `/api/settings`,
`/api/transfers` — all JSON, `GET`/`POST` (plus `PUT`/`DELETE` where implemented).

## Styling

Tailwind v4 is configured CSS-first: design tokens (colours, radii, shadows) live in the
`@theme` block of `src/app/globals.css`, and `src/app/globals.css` is imported once from
`src/app/layout.tsx`. There is no `tailwind.config.js` — re-skin the app by editing the
tokens.

## Scripts

| Command         | Purpose                              |
| --------------- | ------------------------------------ |
| `npm run dev`   | Dev server on `0.0.0.0:3000`         |
| `npm run build` | Production build + type check        |
| `npm run start` | Serve the production build           |
| `npm run lint`  | ESLint                               |
| `npm run migrate` | Apply `schema.sql` to Neon         |
