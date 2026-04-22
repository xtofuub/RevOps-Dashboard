# RevOps Dashboard

An internal operating dashboard for weekly RevOps snapshots. The app is built with Next.js 16, React 19, shadcn/ui, Recharts, and SQLite-backed snapshot history.

## What it does

- Shows weekly revenue, product-market, and delivery health in a single dashboard
- Stores weekly snapshots in SQLite with immutable revision history
- Auto-calculates `pipelineVelocity` from saved snapshot history instead of requiring manual entry
- Projects a directional `+7d` and `+30d` estimate from saved weekly trends
- Exports the saved timeline to Excel

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run test
```

## Data storage

- Primary storage: `data/revops-dashboard.db`
- Legacy seed source: `data/weekly-metrics.json`
- Saving the same `weekOf` again creates a new revision and updates the latest visible version for that week

Useful environment overrides:

```bash
REVOPS_DASHBOARD_DB_PATH=/custom/path/revops-dashboard.db
REVOPS_LEGACY_SNAPSHOT_PATH=/custom/path/weekly-metrics.json
```

## Important routes

- `/dashboard` - main dashboard
- `/api/weekly-snapshots` - timeline GET and snapshot POST
- `/api/weekly-snapshots/[weekOf]/revisions` - revision history for a reporting week
- `/api/export/weekly-snapshots` - Excel export

## Project docs

- [Developer Guide](docs/developer-guide.md)
- [User Guide](docs/user-guide.md)

## Key implementation files

- `components/dashboard-workspace.tsx` - main dashboard surface
- `components/weekly-update-form.tsx` - weekly snapshot form
- `lib/kpi-dashboard.ts` - schemas, metric definitions, formatting, derived velocity logic
- `lib/dashboard-forecast.ts` - 7 day and 30 day projection logic
- `lib/dashboard-db.ts` - SQLite schema, migration, revision persistence
- `lib/dashboard-store.ts` - server-side data access

## Notes for maintainers

- This repo uses a newer Next.js version than older examples online. Read the local docs in `node_modules/next/dist/docs/` before making framework-level changes.
- Keep UI changes conservative unless explicitly requested. Most product work should land in data flow, reporting logic, and maintainability first.
- The forecast is directional, not a committed target. Treat it as an operating signal.
