# Sakigai Furniture — Frontend (Ondorkotha)

Next.js storefront and admin dashboard for the Ondorkotha furniture e-commerce platform. Talks to the [Sakigai backend API](../../furniture-backend/sakigai-furniture-website) over REST and a Socket.IO connection for realtime order updates.

## Project Overview

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Data fetching/state:** TanStack Query, Zustand
- **Realtime:** socket.io-client (order status, live updates)
- **Payments:** SSLCOMMERZ (feature-flagged)
- **Other notable libraries:** Framer Motion, Swiper, react-hot-toast, SweetAlert2, jsbarcode, recharts (admin analytics), react-markdown

The app serves two audiences from one codebase:
- **Storefront** (`src/app/*` — home, products, categories, cart, checkout, customer account, etc.)
- **Admin dashboard** (`src/app/admin/*`) for managing products, orders, inventory, suppliers, content, and permissions

## Running Locally

### Prerequisites

- Node.js 20+
- The [backend API](../../furniture-backend/sakigai-furniture-website) running and reachable (defaults to `http://localhost:3000/api/v1`)

### Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values, see below
npm run dev
```

The app runs on `http://localhost:7000` (the dev script pins this port).

## Environment Variables

Copy `.env.example` to `.env.local` and configure. Key variables:

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` / `production` |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (e.g. `http://localhost:3000/api/v1`) |
| `NEXT_PUBLIC_BRAND_NAME` | Site/brand name shown in the UI |
| `NEXT_PUBLIC_PHONE_NUMBER`, `NEXT_PUBLIC_PHONE_LABEL` | Contact phone number and display label |
| `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_PHONE`, `NEXT_PUBLIC_SUPPORT_HOURS` | Support contact details shown in help/support sections |
| `NEXT_PUBLIC_PAYMENT_GATWAY_NAME` | Display name of the active payment gateway |
| `NEXT_PUBLIC_SSLCOMMERZ_ENABLED` | Toggles SSLCOMMERZ checkout on/off |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD` | SSLCOMMERZ credentials (server-side use, e.g. API routes) |
| `NEXT_PUBLIC_PRODUCTS_PER_PAGE` | Pagination size for product listings |
| `NEXT_PUBLIC_PARTIAL_PAYMENT_MIN`, `NEXT_PUBLIC_PARTIAL_PAYMENT_MAX` | Allowed range (%) for partial/advance payments at checkout |
| `PATHAO_MERCHANT_STORE_ID` | Pathao store reference, if used client-side (currently commented out) |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager container ID |

## Production / Deployment

```bash
npm ci
npm run build
npm run start
```

`npm run start` serves the production build on the port Next.js is configured for (override with `PORT`).

A `Dockerfile` is included for containerized deployment:

```bash
docker build -t sakigai-frontend .
docker run -p 7000:7000 --env-file .env.local sakigai-frontend
```

The container listens on port `7000` by default (`PORT`/`HOSTNAME` are set in the `Dockerfile`).

## Database / Migration Commands

This app has no database of its own — all data is served by the backend API. There are no migration or seed commands to run here; see the backend README for database setup.

## Important Folders & Features

| Path | Purpose |
|---|---|
| `src/app` | Route segments (App Router). Storefront routes live at the top level (`products`, `categories`, `cart`, `checkout`, `order`, `customer`, `blogs`, `wishlist`, `favorites`, etc.); admin routes live under `admin/` |
| `src/app/admin` | Admin dashboard: products, categories/subcategories/series, inventory, suppliers, purchases, orders, refunds/returns, promotions, banners, CMS, blog, courier settings, roles/permissions, admin users, activity log, tickets, settings |
| `src/component` | Shared and feature UI components, grouped by domain (`Product`, `Order`, `Checkout`, `Payment`, `Courier`, `Customer`, `Dashboard`, `Invoice`, `Supplier`, `Sales`, `Refund`, `Reviews`, etc.) and `admin/` for admin-specific UI |
| `src/component/PageView` | Page-view tracking |
| `src/component/TagManager` | Google Tag Manager / Meta Pixel integration |
| `src/config` | App-level configuration, including `adminPermissions.ts` for role-based UI gating |
| `src/context` | React context providers |
| `src/hooks` | Shared React hooks |
| `src/lib/api` | API client setup (Axios instance, request helpers) |
| `src/lib/seo` | SEO metadata helpers |
| `src/types` | Shared TypeScript types |
| `src/utils` | General utility functions |
| `src/data` | Static/local data used by the UI |

## Linting

```bash
npm run lint
```
