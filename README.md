# Garahe — Vehicle Maintenance Log

Garahe is a personal vehicle maintenance tracker for car owners who want to keep a clear, searchable record of every service job, expense, and odometer reading across all their vehicles.

**Live demo (GitHub Pages):** https://stephennavena.github.io/garahe-vehicle-maintenance-system/
**API (Render):** https://garahe-api.onrender.com
**Demo video:** See [`docs/05-demo-video.md`](docs/05-demo-video.md)

> **Demo mode is the default.** The live site runs with `VITE_USE_MOCK_API=true` — all data stays in your browser's `localStorage`. No account, email, or database required to try it.

---

## Overview

Instead of keeping paper receipts or relying on memory, Garahe lets you log every maintenance job — oil change, brake replacement, tire rotation — along with the date, odometer reading, cost, and workshop name. The dashboard shows a spending trend chart, service reminder alerts, and a live summary across all your vehicles.

Private **Garage Workspaces** let each user keep their own data isolated behind a short code (e.g. `GRH-8821`). Type the same code on any device to load your records — no password or account registration needed.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, React Router 7, vanilla CSS |
| Backend | Node.js 20, Express 4, Helmet, CORS |
| Database | PostgreSQL 16+ (connection pooling via `pg`) |
| Frontend hosting | GitHub Pages (automated via GitHub Actions) |
| Backend hosting | Render (Web Service) |
| Database hosting | Neon (managed serverless PostgreSQL) |

---

## Setup and installation

### Requirements

- **Node.js** v20 or later
- **PostgreSQL** 16 or later (for the full stack — not needed in demo mode)

### Clone

```bash
git clone https://github.com/stephennavena/garahe-vehicle-maintenance-system.git
cd garahe-vehicle-maintenance-system
```

### Option A — Client only (demo mode, no database needed)

```bash
cd client
npm install
cp .env.example .env    # VITE_USE_MOCK_API=true by default
npm run dev             # http://localhost:5173
```

Data is saved to `localStorage` in your browser. Nothing is sent to a server.

### Option B — Full stack (Express + PostgreSQL)

**1. Database**

Create a local PostgreSQL database:

```bash
psql -U postgres -c "CREATE DATABASE garahe;"
```

**2. Server**

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/garahe
CORS_ORIGINS=http://localhost:5173
NODE_ENV=development
```

Create the tables and load sample data:

```bash
npm run db:reset    # runs schema.sql then seed.sql
```

**3. Client**

```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:

```env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:3000
```

---

## Running locally

**API server** (in `server/`):

```bash
npm run dev
# Listening on http://localhost:3000
# GET /healthz  →  { "ok": true }
# GET /readyz   →  { "ok": true, "db": "up" }
```

**Frontend** (in `client/`):

```bash
npm run dev
# Open http://localhost:5173
```

---

## Features

### Garage Workspaces (multi-tenancy)

- Create a private workspace with a generated Garage Code (e.g. `GRH-8821`) — no email or password required.
- Switch between devices by typing your code in the Account modal, or share a direct link (`?garage=YOUR-CODE`).
- All PostgreSQL queries filter by `garage_id` in parameterised statements, ensuring strict tenant isolation.
- The built-in **Demo Showcase** garage comes pre-seeded with sample vehicles and records for instant evaluation.

### Dashboard

- Summary cards: total vehicles, total jobs, total spend (₱), last service date.
- Monthly spending SVG bar chart with a breakdown table toggle (total per month, job count, % share).
- Clickable recent activity feed — the 5 most recent entries across all vehicles, linking to their history.
- Overdue / due-soon alert banners across all vehicles.

### Service Reminders

- 17 built-in job types with km and/or day intervals (Oil Change, PMS, Brake Pads, Brake Fluid, Tire Rotation, Air Filter, Cabin Filter, Battery Replacement, Spark Plugs, Coolant Flush, Transmission Service, Timing Belt, Wheel Alignment, Suspension, Wiper Blades, General Inspection).
- Overdue 🔴 and due-soon 🟡 badges on vehicle cards in both the Dashboard and Vehicles views.
- Explicit next-due mileage field (`next_due_km`) per entry — overrides the generic km interval when set.

### Vehicles

- Add and edit vehicles with model name, current odometer reading (km), and an optional photo (file upload or URL).
- Real-time vehicle search.
- Quick odometer update inline — update km without creating a maintenance entry.
- Safe delete with a confirmation modal — cascades to remove all maintenance records for that vehicle.
- Per-vehicle stats: jobs logged, total spend, last service date, cost per km.

### Maintenance Logging

- **Multi-job visits:** Log multiple service jobs in a single form submission (same date, same odometer) — each gets its own job type, cost, shop name, and notes.
- Visit-level fields: service date (no future dates allowed), odometer at service.
- Pre-fills from the most recent entry to speed up repeat visits.
- Optional `next_due_km` field sets a custom reminder target for any job.
- Client-side validation with inline error messages before any API call is made.

### Maintenance History

- Filterable, sortable list: keyword search (job, shop, notes), job type dropdown, date range, sort by newest / oldest / highest cost.
- Inline edit for any record — updates vehicle mileage automatically if the edited mileage is higher.
- CSV export (UTF-8 BOM, Excel-compatible) of the full maintenance log for a vehicle.
- Per-vehicle stats: total jobs, total cost, last service date, ₱/km metric.
- Reminder banners showing exact overdue/due-soon detail per job type.

### UX

- Toast notifications for every create, update, delete, and error action.
- Custom confirmation modal (no browser `confirm()` dialogs).
- Dynamic browser tab title per page via `usePageTitle` hook.
- Keyboard shortcuts: `Escape` closes any open form or edit panel.
- Responsive layout — works on mobile browsers.

---

## API reference

All routes require an `X-Garage-Id` request header (defaults to `demo` on the server if omitted).

### Vehicles

| Method | Path | Body / Notes |
|--------|------|-------------|
| `GET` | `/api/vehicles` | Returns all vehicles for the active garage |
| `GET` | `/api/vehicles/:id` | Single vehicle |
| `POST` | `/api/vehicles` | `model`, `current_mileage`, `photo_url` |
| `PUT` | `/api/vehicles/:id` | `model`, `current_mileage`, `photo_url` |
| `DELETE` | `/api/vehicles/:id` | Cascades to maintenance entries |

### Maintenance entries

| Method | Path | Body / Notes |
|--------|------|-------------|
| `GET` | `/api/maintenance` | All entries; `?vehicleId=N` to filter |
| `GET` | `/api/maintenance/:id` | Single entry |
| `POST` | `/api/maintenance` | `vehicle_id`, `job_type`, `date`, `mileage`, `cost`, `notes`, `shop_name`, `next_due_km` |
| `PUT` | `/api/maintenance/:id` | Same fields; syncs vehicle mileage if higher |
| `DELETE` | `/api/maintenance/:id` | Single entry |

### Garages

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/garages/:id` | Lookup a garage code; `404` if not found |
| `POST` | `/api/garages` | `id`, `name` — creates or updates a garage record |

### Health

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/healthz` | `{ "ok": true }` |
| `GET` | `/readyz` | `{ "ok": true, "db": "up" }` or `503` |

---

## Project structure

```
garahe-vehicle-maintenance-system/
├── client/                       # React + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   ├── index.js          # Selects mock or real API via env var
│   │   │   ├── mockApi.js        # localStorage-backed fake backend
│   │   │   ├── httpApi.js        # Fetch calls to the Express API
│   │   │   └── seed.json         # Demo data for mock mode
│   │   ├── components/
│   │   │   ├── Dashboard.jsx     # Stats, spending chart, recent activity
│   │   │   ├── SpendingChart.jsx # SVG monthly bar chart with table toggle
│   │   │   ├── Vehicles.jsx      # Vehicle list, search, add, edit, delete
│   │   │   ├── AddMaintenance.jsx # Multi-job form, next due km, pre-fill
│   │   │   ├── MaintenanceHistory.jsx # History, filters, inline edit, CSV export
│   │   │   ├── GarageModal.jsx   # Workspace switcher, code display, sync link
│   │   │   ├── ConfirmModal.jsx  # Accessible delete confirmation dialog
│   │   │   ├── Toast.jsx         # Floating success/error notifications
│   │   │   └── DemoNotice.jsx    # Banner shown while in demo/mock mode
│   │   ├── context/
│   │   │   └── GarageContext.jsx # Active garage state, code generation, URL parsing
│   │   ├── hooks/
│   │   │   └── usePageTitle.js   # Sets document.title per page
│   │   ├── utils/
│   │   │   └── serviceReminders.js # Interval thresholds, overdue/due-soon logic
│   │   ├── styles.css            # Dark slate theme, responsive grid, all component styles
│   │   └── main.jsx              # App entry point
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                       # Express + PostgreSQL API
│   ├── db/
│   │   ├── schema.sql            # Full table definitions (safe to run twice)
│   │   ├── migrate_v2.sql        # Adds photo_url, next_due_km, shop_name
│   │   ├── migrate_v3.sql        # Adds garage_id for multi-tenancy
│   │   ├── seed.sql              # Sample data for the demo garage
│   │   ├── pool.js               # pg.Pool configuration
│   │   └── run.js                # CLI helper to execute .sql files
│   ├── maintenanceRepo.js        # Parameterised SQL data-access layer
│   ├── server.js                 # Express routes, middleware, validation
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy-pages.yml      # Builds and deploys client to GitHub Pages on push to main
├── docs/                         # Proposal, mockups, design system, weekly reports, demo video
├── AI-USAGE.md                   # Full log of AI assistance used in this project
├── compose.yml                   # Docker Compose for local self-hosting (server + PostgreSQL)
├── .gitignore
├── .env.example                  # Root-level env example (Compose variables)
└── README.md
```

---

## Deployment

The project is deployed across three services:

### Frontend — GitHub Pages

Automated via `.github/workflows/deploy-pages.yml`. Every push to `main` triggers a Vite build and deploys `client/dist` to GitHub Pages.

Required repository **Variables** (`Settings → Secrets and variables → Actions → Variables`):

| Variable | Value |
|----------|-------|
| `VITE_USE_MOCK_API` | `false` |
| `VITE_API_BASE_URL` | `https://garahe-api.onrender.com` |

GitHub Pages must be enabled once manually: `Settings → Pages → Source: GitHub Actions`.

### Backend API — Render

Web Service pointed at the `server/` directory.

Required environment variables set in the Render dashboard:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon connection string |
| `CORS_ORIGINS` | `https://stephennavena.github.io` |
| `NODE_ENV` | `production` |

### Database — Neon

Free managed PostgreSQL. Schema was initialised by running, in order:

```bash
node --env-file=.env db/run.js db/schema.sql
node --env-file=.env db/run.js db/migrate_v2.sql
node --env-file=.env db/run.js db/migrate_v3.sql
```

---

## Database schema

```sql
garages (id VARCHAR(64) PK, name TEXT, created_at TIMESTAMPTZ)

vehicles (
  id SERIAL PK,
  model TEXT NOT NULL,
  current_mileage INTEGER NOT NULL DEFAULT 0,
  photo_url TEXT NOT NULL DEFAULT '',
  garage_id VARCHAR(64) NOT NULL DEFAULT 'demo',
  created_at TIMESTAMPTZ
)

maintenance_entries (
  id SERIAL PK,
  vehicle_id INTEGER → vehicles(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  date DATE NOT NULL,
  mileage INTEGER NOT NULL,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  next_due_km INTEGER,
  shop_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ
)
```

---

## Environment variables

### `client/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_USE_MOCK_API` | `true` | `false` to use the real Express API |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL of the Express API |

### `server/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed origins |
| `NODE_ENV` | — | `production` on hosted environments |
| `PORT` | — | Set by the host automatically; do not set manually |

---

## AI usage

This project was built with AI assistance. See [AI-USAGE.md](AI-USAGE.md) for the full record of prompts used, what was generated, what was kept, and what was changed.

---

## Author

Stephenn C. Avena
CS – 401 · 2203-6APSI

## Licence

MIT — see [LICENSE](LICENSE).
