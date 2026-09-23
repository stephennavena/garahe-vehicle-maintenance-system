# AI usage

This project was built with AI assistance. This file is the record of it. It is
graded as the finals badge, and it is worth 100 points.

## 1. How I used AI

### 2026-09-23 - Frontend scaffold and component structure

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** Help converting the base template into a vehicle maintenance log app called "Garahe". I described my wireframe and asked for a full React frontend with a Dashboard, vehicle list, and maintenance form.
- **What it gave back:** A set of React components — `Dashboard.jsx`, `VehicleList.jsx`, `AddMaintenance.jsx`, `MaintenanceHistory.jsx`, and `DemoNotice.jsx` — along with a mock API (`mockApi.js`) and seed data (`seed.json`) so the UI works without a real backend.
- **What I kept, what I changed, and why:** I kept the overall structure and the mock API approach. I adjusted the colour scheme and the labels to match the Filipino context of the app (e.g. using "Garahe" as the brand name). I also moved the demo notice banner to the top so it was more visible.
- **Commit:** *(add your commit SHA here after pushing)*

### 2026-09-23 - Responsive CSS styling

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** Make the app mobile-first and responsive since it will primarily be used on a phone.
- **What it gave back:** Updated CSS with a mobile-first layout, flexbox-based navigation, and a card grid that collapses to a single column on small screens.
- **What I kept, what I changed, and why:** I kept all of it. The layout now works well on both phone and desktop screens, which was the main requirement.
- **Commit:** *(add your commit SHA here after pushing)*

### 2026-09-23 - Demo mode implementation

- **Tool:** Google Antigravity (Gemini)
- **What I asked for:** A way to make the site usable without a backend, so it can be shown before the server and database are connected.
- **What it gave back:** A `VITE_USE_MOCK_API` environment variable flag in `.env.example` and a `mockApi.js` file that intercepts API calls and returns fake data from `seed.json`.
- **What I kept, what I changed, and why:** Kept as-is. It lets me show a working demo at every stage of development even before the backend exists.
- **Commit:** *(add your commit SHA here after pushing)*

---

*More entries will be added each week as AI assistance is used.*

## 2. Where the AI got it wrong

*(To be filled in as the project progresses — at least 3 cases required by final submission.)*

### Case 1 - *(to be added)*

- **What it gave me:**
- **What was wrong with it:**
- **What I did instead:**
- **Commit:**

## 3. Who wrote what

### Written by me

- **File:** `client/src/api/seed.json`
- **Commit:** *(add after pushing)*
- **What it does and why it is built this way:** This is the sample data file that populates the demo. I wrote the vehicle names, dates, job types, and costs myself to reflect realistic Filipino car maintenance records (e.g. PMS, oil change intervals, local peso amounts).

### The AI-written part I understand best

- **File:** `client/src/api/mockApi.js`
- **Commit:** *(add after pushing)*
- **What it does and why we kept it:** This file intercepts fetch calls and returns data from `seed.json` instead of hitting a real server. We kept it because it lets the whole frontend be demonstrated without needing Express or PostgreSQL to be running yet.
