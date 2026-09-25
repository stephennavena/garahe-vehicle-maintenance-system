# AI usage

This project was built with AI assistance. This file is the record of it. It is
graded as the finals badge, and it is worth 100 points.

## 1. How I used AI

### 2026-09-23 - Frontend scaffold and component structure

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** Help converting the base template into a vehicle maintenance log app called "Garahe". I described my wireframe and the screens I wanted — a vehicle list, a maintenance history per vehicle, and an add-entry form.
- **What it gave back:** A set of React components — `Dashboard.jsx`, `VehicleList.jsx`, `AddMaintenance.jsx`, `MaintenanceHistory.jsx`, and `DemoNotice.jsx` — along with a mock API (`mockApi.js`) and sample data structure.
- **What I kept, what I changed, and why:** I kept the component structure but rewrote the labels, field names, and copy to match the Filipino context — "Garahe" as the brand name, peso (₱) for costs, job types like "PMS" that are specific to local car culture. I also repositioned the demo notice banner to the top of the page so it would be immediately visible to anyone visiting the demo.
- **Commit:** *(add your commit SHA here after pushing)*

### 2026-09-23 - Responsive CSS and mobile-first layout

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** Make the app responsive and mobile-first, since it will mainly be used on a phone while at the mechanic.
- **What it gave back:** A CSS rewrite using flexbox, a collapsing card grid, and a bottom navigation bar suited for thumb reach.
- **What I kept, what I changed, and why:** I kept the overall approach but adjusted the colour palette. The original colours were too generic — I chose a darker, more grounded tone that feels more appropriate for a car maintenance tool than a general-purpose app.
- **Commit:** *(add your commit SHA here after pushing)*

### 2026-09-23 - Demo mode and mock API

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** A way to show the app working before the backend exists, so there is always a live link to share.
- **What it gave back:** The `VITE_USE_MOCK_API` flag pattern and a `mockApi.js` that stores data in `localStorage` and simulates network delay.
- **What I kept, what I changed, and why:** Kept as-is. The design of the mock matching the real API's function signatures is what makes switching to the real backend a one-line change — I understood that was the point and kept the pattern intact.
- **Commit:** *(add your commit SHA here after pushing)*

### 2026-09-25 - Database schema design

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** Help writing the PostgreSQL schema for two tables — vehicles and maintenance entries — based on the data shape I already defined in `seed.json`.
- **What it gave back:** `schema.sql` with `vehicles` and `maintenance_entries` tables, a foreign key with `ON DELETE CASCADE`, and a composite index on `vehicle_id` and `date`.
- **What I kept, what I changed, and why:** I reviewed the schema against my `seed.json` field names and confirmed the types made sense — `NUMERIC(10,2)` for cost, `DATE` for the service date, `INTEGER` for mileage. I asked for the cascade delete specifically because I decided that removing a vehicle should remove its history automatically.
- **Commit:** *(add your commit SHA here after pushing)*

### 2026-09-25 - Express API routes and server-side validation

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** Replace the template's ghost sightings API with routes for my vehicles and maintenance entries, with validation on each field.
- **What it gave back:** `server.js` with `GET`, `POST`, `PUT`, `DELETE` routes for vehicles and `GET`, `POST`, `DELETE` for maintenance entries, plus `validateVehicle()` and `validateEntry()` functions.
- **What I kept, what I changed, and why:** I kept the validation structure but reviewed every field limit — 120 characters for model name, 2000 for notes — and confirmed they were reasonable for the use case. I also checked that the `cost` field accepted decimals (it uses `NUMERIC(10,2)` in the schema), which the original entry validation handled correctly.
- **Commit:** *(add your commit SHA here after pushing)*

### 2026-09-25 - Connecting the frontend to the real API (httpApi.js)

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** Help writing `httpApi.js` — the file that calls the real Express API with the same function signatures as `mockApi.js`.
- **What it gave back:** An initial version, but it had two bugs: it used `PATCH` instead of `PUT` for vehicle updates, and used the wrong URL pattern for listing maintenance entries.
- **What I kept, what I changed, and why:** I caught both bugs while testing — the PATCH request was returning 404 and the maintenance list was returning an empty array. I reported both and the corrected version uses `PUT` and the `?vehicleId=N` query parameter that the server actually implements. I also asked for the camelCase normalisation layer specifically, because I noticed the DB was returning `vehicle_id` and `current_mileage` but the components were expecting `vehicleId` and `currentMileage`.
- **Commit:** *(add your commit SHA here after pushing)*

---

## 2. Where the AI got it wrong

### Case 1 - Wrong HTTP method for vehicle update

- **What it gave me:** `httpApi.js` used `PATCH` for `updateVehicle()`.
- **What was wrong with it:** The Express server only registered a `PUT` route at `/api/vehicles/:id`. `PATCH` requests were falling through to the 404 handler, so every update silently failed.
- **What I did instead:** I caught this during testing when vehicle edits were not saving. I identified the mismatch between the client method and the server route and had the client corrected to use `PUT`.
- **Commit:** *(add your commit SHA here after pushing)*

### Case 2 - Wrong URL pattern for listing maintenance entries

- **What it gave me:** The initial `httpApi.js` called `/api/vehicles/:id/maintenance` to list entries for a vehicle.
- **What was wrong with it:** The server did not have that route. It uses `/api/maintenance?vehicleId=N`. The call was returning a 404 and the maintenance history was showing as empty even when data existed in the database.
- **What I did instead:** I noticed the maintenance history was blank after switching off mock mode. I checked the server routes directly and confirmed the correct URL pattern, then had `httpApi.js` updated to match.
- **Commit:** *(add your commit SHA here after pushing)*

### Case 3 - PostgreSQL PATH not set on Windows

- **What it gave me:** Instructions to run `psql -U postgres -c "CREATE DATABASE garahe;"` after installing PostgreSQL.
- **What was wrong with it:** PostgreSQL's `bin` folder is not automatically added to the Windows PATH. The command failed with "psql is not recognised" immediately after a fresh install.
- **What I did instead:** I found the PostgreSQL installation directory (`C:\Program Files\PostgreSQL\18\bin`) and added it to the user PATH variable permanently using PowerShell. This is a Windows-specific step that the instructions did not mention.
- **Commit:** *(add your commit SHA here after pushing)*

---

## 3. Who wrote what

### Written by me

- **File:** `client/src/api/seed.json` and `server/db/seed.sql`
- **Commit:** *(add after pushing)*
- **What it does and why it is built this way:** These files hold the sample data that populates the app in demo and development mode. I wrote all the vehicle names, dates, job types, mileage figures, and costs myself. The data is based on my own cars and reflects realistic Filipino car maintenance — PMS intervals, Castrol and Petron oil brands, peso amounts that match actual shop prices. No AI generated this content; it required knowing what a real Philippine car maintenance record looks like.

### The AI-written part I understand best

- **File:** `client/src/api/index.js`
- **Commit:** *(add after pushing)*
- **What it does and why we kept it:** This file is the single export point for all API functions. It reads `VITE_USE_MOCK_API` at build time and picks either `mockApi.js` or `httpApi.js` — then re-exports the chosen implementation's functions. Because of this, no component ever imports directly from `mockApi` or `httpApi`; they only import from `index.js`. This means switching the entire backend is literally one environment variable change. I kept it exactly as-is because the design is clean and I understood why it was built this way — it is the pattern that makes the mock-to-real switch cost nothing.
