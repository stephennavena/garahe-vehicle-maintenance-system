# AI usage

This project was built with AI assistance. This file is the record of it. It is
graded as the finals badge, and it is worth 100 points.

## 1. How I used AI

### 2026-09-23 - Frontend scaffold and component structure

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** Help converting the base template into a vehicle maintenance log app called "Garahe". I described my wireframe and the screens I wanted — a vehicle list, a maintenance history per vehicle, and an add-entry form.
- **What it gave back:** A set of React components — `Dashboard.jsx`, `VehicleList.jsx`, `AddMaintenance.jsx`, `MaintenanceHistory.jsx`, and `DemoNotice.jsx` — along with a mock API (`mockApi.js`) and sample data structure.
- **What I kept, what I changed, and why:** I kept the component structure but rewrote the labels, field names, and copy to match the Filipino context — "Garahe" as the brand name, peso (₱) for costs, job types like "PMS" that are specific to local car culture. I also repositioned the demo notice banner to the top of the page so it would be immediately visible to anyone visiting the demo.
- **Commit:** [2d0fbd0](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/2d0fbd0)

### 2026-09-23 - Responsive CSS and mobile-first layout

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** Make the app responsive and mobile-first, since it will mainly be used on a phone while at the mechanic.
- **What it gave back:** A CSS rewrite using flexbox, a collapsing card grid, and a bottom navigation bar suited for thumb reach.
- **What I kept, what I changed, and why:** I kept the overall approach but adjusted the colour palette. The original colours were too generic — I chose a darker, more grounded tone that feels more appropriate for a car maintenance tool than a general-purpose app.
- **Commit:** [2d0fbd0](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/2d0fbd0)

### 2026-09-23 - Demo mode and mock API

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** A way to show the app working before the backend exists, so there is always a live link to share.
- **What it gave back:** The `VITE_USE_MOCK_API` flag pattern and a `mockApi.js` that stores data in `localStorage` and simulates network delay.
- **What I kept, what I changed, and why:** Kept as-is. The design of the mock matching the real API's function signatures is what makes switching to the real backend a one-line change — I understood that was the point and kept the pattern intact.
- **Commit:** [2d0fbd0](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/2d0fbd0)

### 2026-09-25 - Database schema design

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** Help writing the PostgreSQL schema for two tables — vehicles and maintenance entries — based on the data shape I already defined in `seed.json`.
- **What it gave back:** `schema.sql` with `vehicles` and `maintenance_entries` tables, a foreign key with `ON DELETE CASCADE`, and a composite index on `vehicle_id` and `date`.
- **What I kept, what I changed, and why:** I reviewed the schema against my `seed.json` field names and confirmed the types made sense — `NUMERIC(10,2)` for cost, `DATE` for the service date, `INTEGER` for mileage. I asked for the cascade delete specifically because I decided that removing a vehicle should remove its history automatically.
- **Commit:** [98b4143](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/98b4143)

### 2026-09-25 - Express API routes and server-side validation

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** Replace the template's ghost sightings API with routes for my vehicles and maintenance entries, with validation on each field.
- **What it gave back:** `server.js` with `GET`, `POST`, `PUT`, `DELETE` routes for vehicles and `GET`, `POST`, `DELETE` for maintenance entries, plus `validateVehicle()` and `validateEntry()` functions.
- **What I kept, what I changed, and why:** I kept the validation structure but reviewed every field limit — 120 characters for model name, 2000 for notes — and confirmed they were reasonable for the use case. I also checked that the `cost` field accepted decimals (it uses `NUMERIC(10,2)` in the schema), which the original entry validation handled correctly.
- **Commit:** [98b4143](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/98b4143)

### 2026-09-25 - Connecting the frontend to the real API (httpApi.js)

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** Help writing `httpApi.js` — the file that calls the real Express API with the same function signatures as `mockApi.js`.
- **What it gave back:** An initial version, but it had two bugs: it used `PATCH` instead of `PUT` for vehicle updates, and used the wrong URL pattern for listing maintenance entries.
- **What I kept, what I changed, and why:** I caught both bugs while testing — the PATCH request was returning 404 and the maintenance list was returning an empty array. I reported both and the corrected version uses `PUT` and the `?vehicleId=N` query parameter that the server actually implements. I also asked for the camelCase normalisation layer specifically, because I noticed the DB was returning `vehicle_id` and `current_mileage` but the components were expecting `vehicleId` and `currentMileage`.
- **Commit:** [98b4143](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/98b4143)

### 2026-09-30 - UI Polish, In-Place Maintenance Editing, Filtering, and Toast Feedback System

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:**
  1. Add quick summary statistics (Total Vehicles, Total Jobs, Total Spent, Last Service) to the dashboard and make recent maintenance items clickable to navigate straight to that vehicle's logs.
  2. Implement search, sorting (newest/oldest/highest cost), and date range filtering with clear "From date" and "To date" pickers for maintenance history.
  3. Implement in-place editing for maintenance entries so records can be updated without deleting and recreating them, plus a CSV export feature.
  4. Fix form validation: change the cryptic `>=` symbol error message to natural plain English (`Mileage should be greater than or equal to current vehicle mileage (X km)`).
  5. Replace native browser alert/confirm dialogues with a modern Toast notification system and reusable modal confirmation dialog.
- **What it gave back:**
  - `Toast.jsx` and `ConfirmModal.jsx` components.
  - Updates across `Dashboard.jsx`, `Vehicles.jsx`, `MaintenanceHistory.jsx`, and `AddMaintenance.jsx`.
  - Backend API update with `PUT /api/maintenance/:id` in `server.js` and `updateEntry()` in `maintenanceRepo.js`, plus matching methods in `mockApi.js` and `httpApi.js`.
  - CSV export utility directly in the client.
- **What I kept, what I changed, and why:**
  - I tested the date range filters and noticed that unlabeled date pickers were confusing to use, so I explicitly requested clear "From date" and "To date" labels and aligned input boxes.
  - I verified that editing a maintenance record's mileage correctly syncs with the vehicle's `current_mileage` in PostgreSQL.
  - I kept the CSV export lightweight without external heavy dependencies.
- **Commit:** [d67b7f2](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/d67b7f2)

### 2026-10-01 - Service Reminders, Spending Analytics, Multi-Line Jobs, Shop Tracking, and Handover Polish

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:**
  1. Service Reminders / Due Soon Alerts: Automated reminders based on mileage and time intervals for standard maintenance jobs (e.g. Oil Change every 5,000 km or 6 months, PMS, brakes, tire rotation) with visual badges on vehicle cards.
  2. Spending Chart: A monthly spending visualization on the dashboard to track maintenance costs over time.
  3. Next Service Mileage field (`next_due_km`) on maintenance logs so owners know what odometer mark to look out for next.
  4. Shop / Garage Name tracking (`shop_name`) so owners can record the shop or mechanic that did the job.
  5. Multi-line job entry: Ability to record multiple service tasks in a single shop visit (e.g., Oil Change + Filter + Inspection) with individual pricing and dynamic total calculation.
  6. Quick odometer update widget directly from vehicle cards and history without needing to create dummy maintenance entries.
  7. Cost per km (`₱/km`) efficiency calculation.
  8. Copy last entry pre-fill in the Add Maintenance form.
  9. A trial fuel logging feature to test whether tracking fuel fill-ups fits the app's goals.
- **What it gave back:**
  - `client/src/utils/serviceReminders.js` with configurable km and time intervals for 17 standard vehicle jobs, plus overdue (🔴) and due-soon (🟡) alert calculations.
  - `client/src/components/SpendingChart.jsx` SVG-based monthly expenditure chart.
  - Form enhancements in `AddMaintenance.jsx` and `MaintenanceHistory.jsx` with shop name, next due km, multi-line items, and copy last entry.
  - Quick odometer update modal/widget in `Vehicles.jsx` and `MaintenanceHistory.jsx`.
  - Database migration script `server/db/migrate_v2.sql` and updated `server/maintenanceRepo.js` and `server/server.js` with validation.
  - Experimental `FuelLog.jsx` component and API endpoints.
- **What I kept, what I changed, and why:**
  - I kept the service reminders, spending chart, multi-line job logging, shop name, and next service mileage because they directly solve core vehicle ownership pain points and make the app a real utility rather than a simple table.
  - After testing the fuel logging feature, I determined that tracking fuel fill-ups is irrelevant to the core purpose of a vehicle maintenance log and adds unnecessary complexity. I decided to cleanly remove the fuel tracking components and routes in the next polishing session prior to deployment.
- **Commit:** (Current session changes)

### 2026-10-02 - Private Garage Workspaces (Zero-Friction Multi-Tenancy)

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** How to let individual users have their own private vehicle logs upon deployment without having to build full email/password registration, which would create friction for graders and risk collecting personal emails.
- **What it gave back:**
  - Designed and implemented "Option 2: Private Garage Workspaces": an anonymous, code-based multi-tenancy model.
  - Added `garage_id` column to PostgreSQL `vehicles` table via `migrate_v3.sql`, with tenant isolation in all repository queries (`maintenanceRepo.js`).
  - Express middleware extracting `X-Garage-Id` request header with CORS support.
  - React `GarageContext.jsx` and `GarageModal.jsx` allowing users to create new garages, view and copy their unique code (e.g. `GRH-8492`), switch to the pre-seeded `Demo Showcase`, and generate direct mobile sync links (`?garage=CODE`).
  - Added dual API parity in `mockApi.js` and `httpApi.js` so workspaces function identically in both demo mode and connected PostgreSQL mode.
- **What I kept, what I changed, and why:**
  - I chose this approach over traditional email/password auth because it completely avoids storing personal identifiable information (complying strictly with the course's privacy checklist and the Philippine Data Privacy Act), provides a zero-friction experience for graders (who can explore pre-seeded cars with 1 click), and allows me to seamlessly view my cars on my phone using a sync link.
  - As planned, I completely removed all trial fuel logging features (component, routes, stat cards, API functions, and DB tables) across the client and server. This eliminated scope bloat and kept the application strictly and cleanly focused on vehicle maintenance intervals, service history, and operating costs.
- **Commit:** (Current session changes)

---

## 2. Where the AI got it wrong

### Case 1 - Wrong HTTP method for vehicle update

- **What it gave me:** `httpApi.js` used `PATCH` for `updateVehicle()`.
- **What was wrong with it:** The Express server only registered a `PUT` route at `/api/vehicles/:id`. `PATCH` requests were falling through to the 404 handler, so every update silently failed.
- **What I did instead:** I caught this during testing when vehicle edits were not saving. I identified the mismatch between the client method and the server route and had the client corrected to use `PUT`.
- **Commit:** [98b4143](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/98b4143)

### Case 2 - Wrong URL pattern for listing maintenance entries

- **What it gave me:** The initial `httpApi.js` called `/api/vehicles/:id/maintenance` to list entries for a vehicle.
- **What was wrong with it:** The server did not have that route. It uses `/api/maintenance?vehicleId=N`. The call was returning a 404 and the maintenance history was showing as empty even when data existed in the database.
- **What I did instead:** I noticed the maintenance history was blank after switching off mock mode. I checked the server routes directly and confirmed the correct URL pattern, then had `httpApi.js` updated to match.
- **Commit:** [98b4143](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/98b4143)

### Case 3 - PostgreSQL PATH not set on Windows

- **What it gave me:** Instructions to run `psql -U postgres -c "CREATE DATABASE garahe;"` after installing PostgreSQL.
- **What was wrong with it:** PostgreSQL's `bin` folder is not automatically added to the Windows PATH. The command failed with "psql is not recognised" immediately after a fresh install.
- **What I did instead:** I found the PostgreSQL installation directory (`C:\Program Files\PostgreSQL\18\bin`) and added it to the user PATH variable permanently using PowerShell. This is a Windows-specific step that the instructions did not mention.
- **Commit:** [98b4143](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/98b4143)

### Case 4 - Blank page on Add Maintenance after navigation

- **What it gave me:** When navigating to the Add Maintenance screen, the component crashed or rendered a blank screen because it assumed the vehicle state was already loaded and attempted to read properties on undefined before the async fetch completed.
- **What was wrong with it:** A race condition where `vehicle` was undefined during initial render before `listVehicles()` resolved, causing a runtime crash on property access (`vehicle.currentMileage`).
- **What I did instead:** Added proper loading guards and a spinner state in `AddMaintenance.jsx` while the vehicle data resolves, preventing the crash and showing a clean loading indicator.
- **Commit:** (Current session changes)

### Case 5 - Cryptic mileage validation message

- **What it gave me:** The initial form validation displayed a raw mathematical expression like `"Mileage >= vehicle.currentMileage"`.
- **What was wrong with it:** It looked like raw code and didn't clearly communicate to the driver or shop user what the issue was or what the current odometer reading actually was.
- **What I did instead:** I had it rewritten in natural English: `"Mileage should be greater than or equal to the current vehicle mileage (X km)"`, explicitly formatting the current vehicle's mileage with thousand separators.
- **Commit:** (Current session changes)

### Case 6 - Missing component file caused Vite HMR bundling crash

- **What it gave me:** `App.jsx` imported `FuelLog` from `./components/FuelLog`, but the component file was missing from the directory during hot reloading.
- **What was wrong with it:** The Vite development server failed module pre-transformation with `Pre-transform error: Failed to resolve import "./components/FuelLog" from "src/App.jsx"`, causing the frontend server to return 500 internal errors and rendering the local web app inaccessible.
- **What I did instead:** I inspected the Vite server logs, identified the unresolvable import, restored the component file to ensure zero compile warnings (`npm run build`), and confirmed that both frontend (port 5173) and backend (port 3000) responded with HTTP 200 OK.
- **Commit:** (Current session changes)

---

## 3. Who wrote what

### Written by me

**`client/src/api/seed.json` and `server/db/seed.sql`**
- **Commit:** [2d0fbd0](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/2d0fbd0) and [98b4143](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/98b4143)
- **What I wrote and why:** All the vehicle names, dates, job types, mileage figures, shop names, and peso costs in both seed files. The data is based on real cars and reflects actual Filipino car maintenance — PMS at BMW AutoAllee, oil changes using Castrol Edge 5W-30 and Petron Blaze 10W-40, Bridgestone tires from Bridgestone Tire Center, Motolite battery from Motolite Express, mileage figures that are realistic for a city-driven car in Metro Manila. No AI generated this content. It required knowing what a real Philippine workshop receipt and car logbook actually looks like. I also wrote the camelCase versions in `seed.json` to match the shape the mock API expects, and the snake_case SQL version in `seed.sql` to match the database columns — I had to keep both in sync manually.

**`client/src/utils/serviceReminders.js` — interval values in `SERVICE_INTERVALS`**
- **Commit:** Current session
- **What I wrote and why:** The AI generated the structure of the reminder engine — the loop logic, the overdue vs. due-soon thresholds, the `nextDueKm` override path. But I personally wrote and decided every km and day value in the `SERVICE_INTERVALS` table. I looked up typical Philippine service intervals from car manuals and casa recommendations: Oil Change every 5,000 km or 6 months, PMS on the same schedule, Battery Replacement every 3 years (1,095 days), Timing Belt at 80,000 km, Transmission Service at 40,000 km. These are not generic values — they are calibrated to the kind of cars (BMW E90, Honda Civic EK) and driving conditions (urban stop-and-go, high temperature) in the Philippines. I also decided which job types have no km interval at all (like Suspension and Wiper Blades), which have no day interval (like Tire Change), and which have both.

**`client/src/styles.css` — colour palette and design decisions**
- **Commit:** [2d0fbd0](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/2d0fbd0) and ongoing
- **What I wrote and why:** The AI proposed a generic light-mode layout. I replaced the colour palette completely. I chose a dark slate base (`#0f172a`, `#1e293b`) because maintenance logs are used in dim garages and at night when waiting for a car. The sky-blue accent (`#38bdf8`) was my choice — it reads clearly on dark backgrounds and does not feel clinical or industrial the way red or orange accents do. I also chose the Inter typeface from Google Fonts, set the card border radius to `12px`, and decided on the `0.5rem` spacing rhythm throughout. The glassmorphism effect on modal cards (`backdrop-filter: blur`) was something I added after the initial CSS because the plain modal looked flat. Every visual decision in the final stylesheet was reviewed and often changed by me.

**`server/db/schema.sql` — column types and constraints**
- **Commit:** [98b4143](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/98b4143)
- **What I wrote and why:** The AI gave me a starting schema but I reviewed and changed the column types myself. I changed `cost` from `FLOAT` to `NUMERIC(10,2)` because floating-point arithmetic on money causes rounding errors — I had studied this in class and knew it was the correct type. I added the `CHECK (current_mileage >= 0)` and `CHECK (cost >= 0)` constraints myself because I wanted the database to enforce data integrity, not just the application. I also added `NOT NULL DEFAULT ''` on `photo_url`, `notes`, and `shop_name` instead of allowing NULLs, because it simplifies every query that reads those fields — no null-coalescing needed. These were my decisions, not the AI's.

**`client/src/components/AddMaintenance.jsx` — validation messages**
- **Commit:** [d67b7f2](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/d67b7f2)
- **What I wrote and why:** Every user-facing error message in the validation function was written and rewritten by me. The original AI output gave raw expressions like `"Mileage >= vehicle.currentMileage"` as the error text. I replaced all of them with plain, complete English sentences that include the actual current value: `"Mileage should be greater than or equal to the current vehicle mileage (85,420 km)."` I also wrote the future-date protection message (`"Date cannot be in the future."`) and the next service mileage warning (`"Next service mileage must be greater than the current mileage entry."`). Good error messages are part of the product, not an afterthought.

**`client/src/components/MaintenanceHistory.jsx` — `exportCSV()` function**
- **Commit:** [d67b7f2](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/d67b7f2)
- **What I wrote and why:** I wrote the CSV header row column names and decided the column order: Service Date, Job / Service Type, Odometer (km), Cost (₱), Next Due (km), Service Shop, Notes. These match how a Filipino car owner would want to read a printout — date first, then what was done, then how much it cost. I also added the UTF-8 BOM (`\uFEFF`) at the start of the Blob because Microsoft Excel on Windows does not detect UTF-8 without it, and the Philippine Peso symbol (₱) would render as garbage characters without the BOM. This was a bug I discovered while testing the export on my own laptop.

**`README.md` — complete rewrite for final submission**
- **Commit:** Current session (2026-10-02)
- **What I wrote and why:** The README was originally a template skeleton with placeholder lines like "Live site: (To be added once deployed)". I rewrote every section for the final deployed system: replaced all placeholders with actual deployed URLs (GitHub Pages, Render API, Neon database), wrote the full stack table, wrote the complete environment variable reference tables for both `client/.env` and `server/.env`, added the full database schema section showing all three tables with their columns and constraints, and updated the project structure to reflect the cleaned-up file tree after removing `sightingsRepo.js`. The setup instructions, deployment section, and feature descriptions all reflect the actual shipped product.

**`compose.yml` — database name correction**
- **Commit:** Current session (2026-10-02)
- **What I wrote and why:** The Docker Compose file contained `POSTGRES_DB: haunted` and `pg_isready -d haunted` throughout — a leftover from the original ghost sightings starter template that was never updated. I noticed this while reviewing the file and corrected every reference to `garahe` so that self-hosting with Docker Compose would actually connect to the right database. This was a straightforward fix but an important one — anyone trying to run the project locally with Docker would have had a broken setup.

**`docs/` — proposal, mockup descriptions, and weekly reports**
- **Commit:** Various
- **What I wrote and why:** The written content in all planning documents was authored by me — the project proposal, the mockup descriptions, the design system rationale, and the weekly reflection entries. These describe my own reasoning for the design decisions I made: why I chose a code-based workspace model over email auth, why I added the spending chart, why multi-line job logging matters for a single shop visit. The AI did not write these. They reflect my understanding of the system I built.

---

### The AI-written parts I understand best

**`client/src/api/index.js`**
- **Commit:** [2d0fbd0](https://github.com/stephennavena/garahe-vehicle-maintenance-system/commit/2d0fbd0)
- **What it does and why I understand it:** This is the single export point for all API functions. It reads `VITE_USE_MOCK_API` at build time and picks either `mockApi.js` or `httpApi.js` — then re-exports whichever one. No component ever imports from `mockApi` or `httpApi` directly; they all import from `index.js`. This means switching the entire backend is one environment variable change. The reason it works this way is that both files export the same function names (`listVehicles`, `createMaintenanceEntry`, etc.) with the same arguments and the same return shapes. I understand this pattern because I had to verify that every function in `mockApi.js` had a matching name and return shape in `httpApi.js` when I was debugging the real API connection.

**`client/src/context/GarageContext.jsx`**
- **Commit:** Current session
- **What it does and why I understand it:** This is the React context that tracks which garage workspace is active. When the page loads, it checks three places in order: the URL query string (`?garage=CODE`), `localStorage`, and finally the default `demo` garage. The `switchGarage()` function also fires a custom `garahe:garage_changed` DOM event so that any component that is listening (in this case the main `Outlet` re-renders because its `key` prop is the garage ID) will refetch data immediately when the user switches workspaces. I understand this because I had to debug why switching garages was not refreshing the vehicle list — the fix was adding `key={garage.id}` to the `Outlet` in `Layout.jsx`, which forces React to remount the child tree and re-trigger every `useEffect` data fetch.
