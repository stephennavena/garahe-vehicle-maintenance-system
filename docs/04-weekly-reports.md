# Weekly reports

Five minutes a week. Add a new section at the top; never edit an old one.

The value is entirely in writing them **while it is happening**. What took four
hours and why is invisible a month later, and it is exactly what your journal
needs.

---

## Week of 2026-09-28 to 2026-10-01

**Done.**
- Built service interval reminder engine (`serviceReminders.js`) with distance and elapsed time triggers for 17 standard maintenance jobs, displaying 🔴 Overdue and 🟡 Due Soon badges on vehicle cards.
- Implemented interactive SVG spending chart on the dashboard tracking monthly maintenance expenditure over time.
- Enhanced maintenance entry with multi-line job items per shop visit, shop/garage name (`shop_name`), next due odometer (`next_due_km`), and 1-click copy last entry shortcut.
- Added quick odometer update widget on vehicle cards and history view without dummy logs, plus cost-per-km (`₱/km`) metric.
- Built PostgreSQL schema migration `server/db/migrate_v2.sql` and ensured dual API parity across Express backend and demo `localStorage` mode.
- Evaluated trial fuel log feature during local testing and decided to remove it to keep the app focused strictly on vehicle maintenance.

**Stuck.**
- Encountered a missing component file reference during hot reloading in Vite that temporarily blocked dev bundle serving; resolved by verifying file presence, testing clean builds (`npm run build`), and documenting root cause in `AI-USAGE.md`.

**Hours.**
- ~14 hours across frontend enhancements, SQL migration, validation, and testing.

**Next.**
- Remove trial fuel logging modules to keep the core maintenance log clean.
- Provision Neon PostgreSQL database and deploy Express API on Render.
- Deploy frontend to GitHub Pages via GitHub Actions and complete live smoke testing.

---

## Week of YYYY-MM-DD

...
