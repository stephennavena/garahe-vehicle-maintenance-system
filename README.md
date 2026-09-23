# Garahe - Vehicle Maintenance Log

Garahe is a car maintenance log that lets car owners record maintenance jobs, track their vehicle's mileage and expenses, and look back at what was done and when it was completed.

**Live site:** (To be added once deployed)
**API:** (To be added once deployed)
**Demo video:** (To be added)

> **This deployment is running in demo mode.** The interface is real; the backend is simulated in your browser so the site works without a server. 

## What it does

- Manage a list of your vehicles with their current mileage.
- View a detailed history of maintenance jobs performed on each vehicle.
- Record new maintenance entries (including job type, date, cost, mileage, and notes).

## Built with

React and Vite on the front end, Express and PostgreSQL on the back end.

## Running it yourself

**The client only, in demo mode.** No database needed.

    cd client
    npm install
    cp .env.example .env        # VITE_USE_MOCK_API stays true
    npm run dev                 # http://localhost:5173

## Project structure

```
garahe-vehicle-maintenance-system/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── api/            # mockApi.js (demo mode) and seed.json (sample data)
│   │   ├── components/     # Dashboard, VehicleList, AddMaintenance, etc.
│   │   └── main.jsx        # App entry point and routing
│   └── .env.example        # Environment variable template
├── server/                 # Express backend (not yet connected)
├── docs/                   # Project documentation and templates
├── AI-USAGE.md             # Record of AI assistance used in this project
├── compose.yml             # Docker Compose config for server + database
└── README.md               # This file
```

## Known issues and next steps

- The backend (Express + PostgreSQL) is not connected yet. All data is currently simulated in the browser using `mockApi.js`.
- There is no user authentication. Any visitor can add or view records in the demo.
- Editing and deleting maintenance entries is not yet implemented.
- **Next steps:** Connect the Express server to PostgreSQL, replace the mock API with real API calls, and implement full CRUD operations on the backend.

## AI usage

This project was built with AI assistance. See [AI-USAGE.md](AI-USAGE.md) for the full record of what was used, what was kept, and what was changed.

## Author

Stephenn C. Avena
CS – 401
2203 – 6APSI

## Licence

MIT, see [LICENSE](LICENSE).
