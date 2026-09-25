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
npm run db:reset
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

### Vehicles
- Add a vehicle by entering its model name and current mileage.
- Each vehicle card shows the current mileage, updated automatically when a new maintenance entry has a higher mileage.
- Delete a vehicle — all associated maintenance entries are removed automatically.

### Maintenance entries
- Select a vehicle, then log a job with: job type, date, mileage at time of service, cost (₱), and optional notes.
- Entries are listed newest-first per vehicle.
- Delete individual entries.

### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/vehicles` | List all vehicles |
| `POST` | `/api/vehicles` | Add a vehicle (`model`, `current_mileage`) |
| `PUT` | `/api/vehicles/:id` | Update a vehicle |
| `DELETE` | `/api/vehicles/:id` | Delete a vehicle and its entries |
| `GET` | `/api/maintenance?vehicleId=N` | List entries (filter by vehicle optional) |
| `POST` | `/api/maintenance` | Add a maintenance entry |
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
│   │   ├── components/         # Dashboard, VehicleList, AddMaintenance, etc.
│   │   └── main.jsx            # App entry point and routing
│   ├── .env.example            # Client environment variable template
│   └── index.html
├── server/                     # Express + PostgreSQL backend
│   ├── db/
│   │   ├── schema.sql          # Table definitions (vehicles, maintenance_entries)
│   │   ├── seed.sql            # Sample data for development
│   │   ├── pool.js             # PostgreSQL connection pool
│   │   └── run.js              # Utility to run .sql files
│   ├── maintenanceRepo.js      # Parameterised SQL queries
│   ├── server.js               # Express routes and validation
│   └── .env.example            # Server environment variable template
├── docs/                       # Assignment templates and guides
├── AI-USAGE.md                 # Record of AI assistance
├── compose.yml                 # Docker Compose (server + database)
└── README.md                   # This file
```

---

## Known issues and next steps

- **No authentication.** Any visitor to the deployed site can add or delete data. User accounts are not implemented.
- **No edit for maintenance entries.** Entries can be added and deleted but not edited in place.
- **Deployment not yet done.** The API and database are running locally only. The GitHub Pages site still runs in demo mode.
- **Next steps:** Deploy the Express API (Render) and PostgreSQL database (Neon), wire up the live environment variables in the GitHub Actions workflow, and add the live URLs to this README.

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
