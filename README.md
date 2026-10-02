# Garahe - Vehicle Maintenance Log

Garahe is a car maintenance log for car owners who want to actively track their vehicle history. It lets you record maintenance jobs, monitor mileage, and review past expenses — all in one place.

**Live site:** (To be added once deployed)
**API:** (To be added once deployed)
**Demo video:** (To be added)

> **Demo mode available.** Set `VITE_USE_MOCK_API=true` to run the frontend without any server or database. All data is stored in your browser's localStorage.

---

## Overview

Garahe solves the common problem of lost or forgotten maintenance records. Instead of keeping paper receipts or relying on memory, car owners can log every job — oil change, tire rotation, brake replacement — along with the date, mileage, and cost. The app shows a full history per vehicle and keeps the current mileage up to date automatically.

---

## Setup and installation

### Requirements

- **Node.js** v20 or later
- **PostgreSQL** 16 or later (for the full stack; not needed in demo mode)

### Clone the repository

```bash
git clone https://github.com/stephennavena/garahe-vehicle-maintenance-system.git
cd garahe-vehicle-maintenance-system
```

### Option A — Client only (demo mode, no database needed)

```bash
cd client
npm install
cp .env.example .env    # VITE_USE_MOCK_API is true by default
npm run dev             # http://localhost:5173
```

### Option B — Full stack (Express + PostgreSQL)

**1. Set up the database**

Create a PostgreSQL database named `garahe`:

```bash
psql -U postgres -c "CREATE DATABASE garahe;"
```

**2. Configure the server**

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` and set your database password:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/garahe
CORS_ORIGINS=http://localhost:5173
NODE_ENV=development
```

**3. Create tables and load sample data**

```bash
# Option 1: Load sample seed data
npm run db:reset

# Option 2: Restore from a PostgreSQL backup dump (if available)
psql -U postgres -d garahe -f garahe-db-backup.sql
```

**4. Configure the client**

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

## How to run it

**Start the API server** (in `server/`):

```bash
npm run dev
# API listening on http://localhost:3000
# GET http://localhost:3000/healthz  →  { "ok": true }
# GET http://localhost:3000/readyz   →  { "ok": true, "db": "up" }
```

**Start the frontend** (in `client/`):

```bash
npm run dev
# Open http://localhost:5173
```

You should see your vehicles listed and be able to add new maintenance entries. Data persists in PostgreSQL across page reloads.

---

## Features and usage

### Private Garage Workspaces (Lightweight Multi-Tenancy)
- **Zero-Friction Private Workspaces:** Users can create an isolated garage workspace with a unique Garage Code (e.g. `GRH-8821`) without needing to register personal emails or manage passwords.
- **Cross-Device Cloud Sync:** Sync your garage seamlessly across mobile and desktop by typing your garage code or sharing a direct sync link (`?garage=CODE`).
- **Complete Tenant Isolation:** PostgreSQL queries filter strictly by `garage_id` in parameterised queries, ensuring that each user only views and modifies their own cars and service history.
- **Instant Demo Showcase:** Graders and visitors can toggle to the pre-seeded `Demo Showcase` garage in 1 click, allowing immediate testing of sample records.

### Interactive Dashboard & Spending Analytics
- **Metric Summary Cards:** Quick stats displaying Total Vehicles, Total Service Jobs logged, Total Maintenance Expenditure (₱), and Date of Last Recorded Service.
- **Monthly Spending Trend Chart:** Visual SVG monthly expenditure chart illustrating maintenance costs over time to track garage spending trends.
- **Clickable Recent Activity:** Displays the latest service entries across all vehicles; clicking any entry routes directly to that vehicle's maintenance history.
- **Empty States:** Clear visual prompts and quick-action links when no vehicles or logs are present.

### Service Reminders & Due-Soon Alerts
- **Intelligent Interval Tracking:** Automated reminder engine (`serviceReminders.js`) based on distance driven (km) and time elapsed (months) across 17 standard maintenance jobs (Oil Change, PMS, Brake Pads, Tire Rotation, Battery, Spark Plugs, Coolant, Transmission Fluid, etc.).
- **Visual Alert Badges:** High-visibility Overdue (🔴) and Due Soon (🟡) badges on vehicle cards and contextual alert banners in vehicle maintenance history views.

### Vehicle Management
- **Add & Edit Vehicles:** Register vehicles with model name and current odometer reading (km), with live in-place editing.
- **Vehicle Photo Support:** Support for vehicle photos with fallback avatars.
- **Quick Odometer Update:** Directly update a vehicle's current odometer from the vehicle card or history view without creating a placeholder maintenance log.
- **Cost per Kilometer Metric:** Automatic calculation of operating maintenance cost per km (`₱/km`) driven.
- **Search Vehicles:** Real-time search filter by vehicle model name.
- **Safe Deletion:** Reusable confirmation modal prevents accidental deletion; deleting a vehicle automatically cascades and removes its maintenance history.

### Maintenance Logging & History
- **Multi-Line Job Items:** Log multiple service jobs performed in a single shop visit (e.g. Oil Change + Brake Inspection + Fluid Top-up) with individual item costs and descriptions, calculating the total automatically.
- **Shop / Garage Name Tracking:** Record the shop or technician name (e.g. "Toyota BGC", "Rapide Pasig", "Shell Helix") for warranty and service reference.
- **Next Service Mileage Field:** Set an optional target odometer reading (`next_due_km`) for the next scheduled service.
- **Copy Last Entry:** 1-click shortcut to pre-fill the form using details from the vehicle's most recent service log.
- **Intelligent Mileage Validation:** Checks odometer input against current vehicle mileage with clear, human-readable error messages showing the vehicle's current km reading.
- **Date Protection:** Disallows accidental future dates on service entries.
- **In-Place Editing:** Update past maintenance records directly from the history view, with automatic vehicle mileage synchronization.
- **Advanced Filtering & Search:**
  - Keyword search across job types, shop names, and notes.
  - Job type dropdown filter.
  - Explicit, user-friendly date range filters ("From date" and "To date") with a single-click reset.
  - Sorting by Newest first, Oldest first, or Highest cost.
- **Cost Analytics:** Live summary of total filtered entries and total cost spent.
- **CSV Data Export:** One-click export of vehicle maintenance logs into `.csv` spreadsheets for offline backup or records.

### User Experience & Architecture
- **Toast Notifications:** Automatic feedback for create, update, delete, and error operations.
- **Custom Confirmation Modals:** Smooth, non-disruptive dialogs replacing standard browser alert/confirm popups.
- **Dynamic Document Titles:** Custom hook updating browser tab titles per screen for better usability.
- **Dual API Support:** Toggle effortlessly between browser `localStorage` demo mode and the full Express + PostgreSQL backend with a single environment variable (`VITE_USE_MOCK_API`).

### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/vehicles` | List all vehicles |
| `POST` | `/api/vehicles` | Add a vehicle (`model`, `current_mileage`, `photo_url`) |
| `PUT` | `/api/vehicles/:id` | Update a vehicle (model, current mileage, photo) |
| `DELETE` | `/api/vehicles/:id` | Delete a vehicle and its entries |
| `GET` | `/api/maintenance?vehicleId=N` | List entries (filter by vehicle optional) |
| `POST` | `/api/maintenance` | Add maintenance entry (`vehicle_id`, `date`, `mileage`, `job_type`, `cost`, `notes`, `shop_name`, `next_due_km`) |
| `PUT` | `/api/maintenance/:id` | Update maintenance entry (syncs vehicle mileage) |
| `DELETE` | `/api/maintenance/:id` | Delete a maintenance entry |
| `GET` | `/healthz` | Process health check |
| `GET` | `/readyz` | Database health check |

---

## Project structure

```
garahe-vehicle-maintenance-system/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   ├── index.js        # Picks mock or real API based on env var
│   │   │   ├── mockApi.js      # Browser-only fake backend (localStorage)
│   │   │   ├── httpApi.js      # Real API calls to Express server
│   │   │   └── seed.json       # Sample data for demo mode
│   │   ├── components/         # UI Components
│   │   │   ├── Dashboard.jsx   # Stats overview, spending chart, recent activity
│   │   │   ├── SpendingChart.jsx # Monthly expenditure SVG trend chart
│   │   │   ├── Vehicles.jsx    # Vehicle listing, badges, search, add, edit
│   │   │   ├── AddMaintenance.jsx # Multi-line jobs, shop name, next due km, copy last entry
│   │   │   ├── MaintenanceHistory.jsx # Filterable table, reminder banners, inline edit, CSV export
│   │   │   ├── GarageModal.jsx # Workspace switcher, code display, and mobile sync link
│   │   │   ├── ConfirmModal.jsx # Accessible confirmation modal dialog
│   │   │   ├── Toast.jsx       # Floating notification alert system
│   │   │   └── DemoNotice.jsx  # Notification banner for demo mode
│   │   ├── context/
│   │   │   └── GarageContext.jsx # Workspace code generator, active garage state, URL parsing
│   │   ├── utils/
│   │   │   └── serviceReminders.js # Interval thresholds, overdue & due-soon calculation
│   │   ├── hooks/
│   │   │   └── usePageTitle.js # Document title manager
│   │   ├── styles.css          # Dark slate theme and responsive layout
│   │   └── main.jsx            # App entry point and routing
│   ├── .env.example            # Client environment variable template
│   └── index.html
├── server/                     # Express + PostgreSQL backend
│   ├── db/
│   │   ├── schema.sql          # Base table definitions (vehicles, maintenance_entries)
│   │   ├── migrate_v2.sql      # Schema additions (shop_name, next_due_km)
│   │   ├── migrate_v3.sql      # Multi-tenancy migration (garage_id column & index)
│   │   ├── seed.sql            # Sample data for development
│   │   ├── pool.js             # PostgreSQL connection pool
│   │   └── run.js              # Utility to run .sql files
│   ├── maintenanceRepo.js      # Parameterised SQL queries (CRUD)
│   ├── server.js               # Express routes and validation
│   └── .env.example            # Server environment variable template
├── docs/                       # Planning documents and reports
├── AI-USAGE.md                 # Detailed log of AI prompts, changes, and errors
├── HANDOVER.md                 # Project handover, environment state, and next steps
├── compose.yml                 # Docker Compose (server + database)
└── README.md                   # Project overview and documentation
```

---

## Deployment checklist & next steps

1. **Production Database (Neon):**
   - Provision free managed PostgreSQL database on Neon.
   - Execute `schema.sql`, `migrate_v2.sql`, and `migrate_v3.sql` to establish production tables.
2. **Backend API (Render):**
   - Connect repository to a Render Web Service (`server/`).
   - Configure production environment variables (`DATABASE_URL`, `CORS_ORIGINS`).
   - Verify health checks at `/healthz` and `/readyz`.
3. **Frontend Client (GitHub Pages):**
   - Configure GitHub Actions build workflow for automated Vite deployment.
   - Set `VITE_API_BASE_URL` to the live Render API URL and build for production.

---

## AI usage

This project was built with AI assistance. See [AI-USAGE.md](AI-USAGE.md) for the full record of what was used, what was kept, and what was changed.

---

## Author

Stephenn C. Avena
CS – 401
2203 – 6APSI

## Licence

MIT, see [LICENSE](LICENSE).
