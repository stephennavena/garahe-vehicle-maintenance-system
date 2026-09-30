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

### Interactive Dashboard
- **Metric Summary Cards:** Quick stats displaying Total Vehicles, Total Service Jobs logged, Total Expenditure (₱), and Date of Last Recorded Service.
- **Clickable Recent Activity:** Displays the latest service entries across all vehicles; clicking any entry routes directly to that vehicle's maintenance history.
- **Empty States:** Clear visual prompts and quick-action links when no vehicles or logs are present.

### Vehicle Management
- **Add & Edit Vehicles:** Register vehicles with model name and current odometer reading (km), with live in-place editing.
- **Vehicle Metrics:** Individual vehicle cards highlight odometer reading, total service logs, total cost spent, and last service date.
- **Search Vehicles:** Real-time search filter by vehicle model name.
- **Safe Deletion:** Reusable confirmation modal prevents accidental deletion; deleting a vehicle automatically cascades and removes its maintenance history.

### Maintenance Logging & History
- **Comprehensive Logging:** Record service jobs with preset categories (PMS, Oil Change, Brake Pads, Tire Rotation, Battery Replacement, Spark Plugs, Coolant Flush, Transmission Fluid, etc.) or custom entries.
- **Intelligent Mileage Validation:** Checks odometer input against current vehicle mileage with clear, human-readable error messages showing the vehicle's current km reading.
- **Date Protection:** Disallows accidental future dates on service entries.
- **In-Place Editing:** Update past maintenance records directly from the history view, with automatic vehicle mileage synchronization.
- **Advanced Filtering & Search:**
  - Keyword search across job types and notes.
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
| `POST` | `/api/vehicles` | Add a vehicle (`model`, `current_mileage`) |
| `PUT` | `/api/vehicles/:id` | Update a vehicle |
| `DELETE` | `/api/vehicles/:id` | Delete a vehicle and its entries |
| `GET` | `/api/maintenance?vehicleId=N` | List entries (filter by vehicle optional) |
| `POST` | `/api/maintenance` | Add a maintenance entry |
| `PUT` | `/api/maintenance/:id` | Update a maintenance entry (syncs vehicle mileage) |
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
│   │   │   ├── Dashboard.jsx   # Stats overview and recent activity
│   │   │   ├── Vehicles.jsx    # Vehicle listing, search, add, and edit
│   │   │   ├── AddMaintenance.jsx # Form with validation for logging jobs
│   │   │   ├── MaintenanceHistory.jsx # Filterable table, inline edit, CSV export
│   │   │   ├── ConfirmModal.jsx # Accessible confirmation modal dialog
│   │   │   ├── Toast.jsx       # Floating notification alert system
│   │   │   └── DemoNotice.jsx  # Notification banner for demo mode
│   │   ├── hooks/
│   │   │   └── usePageTitle.js # Document title manager
│   │   ├── styles.css          # Dark slate theme and responsive layout
│   │   └── main.jsx            # App entry point and routing
│   ├── .env.example            # Client environment variable template
│   └── index.html
├── server/                     # Express + PostgreSQL backend
│   ├── db/
│   │   ├── schema.sql          # Table definitions (vehicles, maintenance_entries)
│   │   ├── seed.sql            # Sample data for development
│   │   ├── pool.js             # PostgreSQL connection pool
│   │   └── run.js              # Utility to run .sql files
│   ├── maintenanceRepo.js      # Parameterised SQL queries (CRUD)
│   ├── server.js               # Express routes and validation
│   └── .env.example            # Server environment variable template
├── docs/                       # Assignment templates and guides
├── AI-USAGE.md                 # Record of AI assistance
├── compose.yml                 # Docker Compose (server + database)
└── README.md                   # This file
```

---

## Known issues and upcoming roadmap

### Known limitations
- **No authentication.** User accounts and JWT-based authentication are not yet implemented. Any visitor to the live site can view or modify records.
- **Local deployment.** The Express API and PostgreSQL database are currently configured for local development.

### Upcoming roadmap & recommended features
- **Service Interval Alerts & Reminders:** Automated reminders based on elapsed mileage (e.g. every 5,000 km) or elapsed time (e.g. every 6 months) for oil changes, PMS, and tire rotation.
- **Fuel Consumption & Mileage Tracking:** Log fuel fill-ups (liters, cost, trip meter) to track fuel efficiency (km/L) and total cost of ownership.
- **Photo & Receipt Attachments:** Upload and attach invoices, parts receipts, or work orders to maintenance logs.
- **PDF Report Generation:** One-click downloadable maintenance summary reports formatted for insurance, vehicle resale, or service history documentation.
- **User Authentication:** Multi-tenant user login and registration to securely isolate personal garages.
- **Production Deployment:** Host PostgreSQL database on Neon, deploy Express API on Render, and host the React client on GitHub Pages.

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
