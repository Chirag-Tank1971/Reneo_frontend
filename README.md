# Reneo Frontend

Modern React UI for the Reneo marketplace backend.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Supabase Auth (JWT)
- Backend API proxy in dev (`/api` → `localhost:3000`)

## Setup

```bash
cd frontend
cp .env.example .env
npm install
```

Fill `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=/api
```

Use the **same Supabase URL and anon key** as the backend `.env`.

For local development, set `VITE_API_URL=/api` (Vite proxies to the backend).

### Vercel deploy

In **Project → Settings → Environment Variables**, set:

```env
VITE_API_URL=https://reneo-backend.onrender.com
```

(or `https://reneo-backend.onrender.com/api` — the backend serves both paths)

**Important:** Vite bakes env vars at **build** time. After changing `VITE_API_URL`, trigger a **Redeploy** on Vercel (Deployments → ⋮ → Redeploy).

If the marketplace shows **"Request failed"** with a **404** in the browser console, the frontend is usually calling `/api/products` on Render while the deployed backend only had `/products`. Redeploy the backend with the latest code (dual `/api` + root routes).

## Run

Terminal 1 — backend:

```bash
cd backend
npm run dev
```

Terminal 2 — frontend:

```bash
cd frontend
npm run dev
```

Or from the backend folder:

```bash
cd backend
npm run dev:frontend
```

Open http://localhost:5173

## Features

- **Auth** — sign up as Customer or Seller
- **Marketplace** — search, filter, paginate products; seller/store names on cards
- **Seller Studio** — create, edit, and archive your own products only
- **Cart & checkout** — localStorage cart persistence, idempotent order placement

## Cart persistence

Customer carts are saved in the browser under the `reneo:cart` localStorage key (per user). Items survive page refresh and sign-out/sign-in on the same browser.

## Notes

- If Supabase email confirmation is enabled, confirm email before signing in.
- Sellers see Seller Studio; customers get cart/checkout.
- Prices and stock are always validated by the backend.
