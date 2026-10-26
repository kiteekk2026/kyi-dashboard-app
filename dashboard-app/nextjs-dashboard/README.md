# Acme Dashboard

A full-stack **Next.js** admin dashboard for managing **customers** and **invoices**, built on the [Next.js Learn Dashboard](https://nextjs.org/learn/dashboard-app) foundation and extended with production-oriented features.

---

## Features

### Core dashboard

- Overview cards and revenue chart
- **Invoices** — create, edit, delete, search, pagination
- **Customers** — list, search, pagination, detail view
- Customer **create / edit / delete** with integrity rules (e.g. block delete when pending invoices exist; archive to history tables)

### Authentication

- **Supabase Auth** (email/password, GitHub, Google OAuth)
- No NextAuth dependency in the current setup

### Avatars & media

- **Preset avatars** (static images under `/public/customers`)
- **Upload new** images via **Vercel Blob** (works on local and Vercel production)
- **From library** modal with cursor-based pagination over Blob storage
- Admin **Media** page to browse/delete uploaded avatars
- Client-safe avatar helpers (no `fs` in Client Components)

### UX & reliability

- Accessible modals (confirm/delete flows)
- Form validation with Zod + field errors (`aria-live`)
- Unique email constraint handling
- `revalidatePath('/dashboard', 'layout')` after mutations so lists, invoice customer dropdowns, and dashboard data stay fresh in production
- Optional patterns discussed in development: audit log, RBAC, feature flags / config management

### Stack

| Layer | Technology |
|--------|------------|
| Framework | Next.js (App Router) |
| UI | React, Tailwind CSS, Heroicons |
| Database | PostgreSQL (Supabase / local) |
| Auth | Supabase Auth |
| File storage | Vercel Blob |
| Validation | Zod |
| Hosting | Vercel (production), local `next dev` |

---

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL (local Supabase or cloud)
- Vercel account (for Blob token in production)

### Setup

```bash
pnpm install
cp .env.example .env.local   # if you maintain an example file
```

Configure environment variables, for example:

```env
POSTGRES_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
BLOB_READ_WRITE_TOKEN=...
```

```bash
pnpm run dev
```

### Production notes

- Do **not** write uploads to `public/` on Vercel (read-only filesystem). Use **Vercel Blob**.
- Ensure `BLOB_READ_WRITE_TOKEN` is set in the Vercel project and redeploy after changes.
- Prefer layout-level revalidation after customer/invoice mutations so cached RSC data updates.

---

## Project structure (high level)

```text
app/
  dashboard/          # Dashboard, invoices, customers
  admin/              # Media (and optional audit/config/RBAC)
  login/              # Auth UI
  lib/
    actions.ts        # Server Actions (CRUD, auth)
    avatars.ts        # Preset paths + URL checks (client-safe)
    blob.ts           # Vercel Blob upload/list/delete
    media.ts          # Media library helpers (Blob-only)
    data.ts           # SQL queries
  ui/                 # Shared UI, forms, buttons, modals
```

---

## Scripts

```bash
pnpm run dev      # Local development
pnpm run build    # Production build
pnpm run start    # Run production build
```

---

## License

Private / team project — update this section if you publish under an open-source license.

---

## Team

* **kyinaing** - [@kyinaing](https://github.com/kyinaing)
* **Ali** - [@alinawz0](https://github.com/alinawz0)
* **Than Myint Htun** - [@than12htun-source](https://github.com/than12htun-source)

---

Built as an extended learning and production-ready dashboard on top of the official Next.js App Router patterns.
