# Developer Guide

## Stack

- Next.js 16 App Router
- React 19
- shadcn/ui with Base UI primitives
- Recharts for charts
- SQLite via `better-sqlite3`
- Vitest for tests

Before changing framework behavior, read the relevant local Next.js docs in `node_modules/next/dist/docs/`.

## High-level architecture

### App routes

- `app/dashboard/page.tsx`
  - Server component that loads snapshots, dashboard data, and forecast data.
- `app/api/weekly-snapshots/route.ts`
  - `GET` returns the timeline, dashboard summary, and forecast.
  - `POST` validates a snapshot payload and stores a new revision.
- `app/api/weekly-snapshots/[weekOf]/revisions/route.ts`
  - Returns revision history for a saved week.
- `app/api/export/weekly-snapshots/route.ts`
  - Builds and downloads the Excel workbook.

### Core libraries

- `lib/kpi-dashboard.ts`
  - Source of truth for metric metadata, snapshot schemas, formatting helpers, and dashboard summary builders.
- `lib/dashboard-forecast.ts`
  - Produces directional `+7d` and `+30d` projections from the latest saved weekly history.
- `lib/dashboard-db.ts`
  - Owns SQLite schema creation, migration from legacy JSON, and revision persistence.
- `lib/dashboard-store.ts`
  - Thin server-only adapter around the DB layer.
- `lib/export-weekly-dashboard.ts`
  - Excel export builder.
- `lib/weekly-snapshot-csv.ts`
  - CSV parsing and template generation helpers.

### Main UI files

- `components/dashboard-workspace.tsx`
  - Dashboard tabs, charts, tables, range controls, and the forecast card.
- `components/weekly-update-form.tsx`
  - Weekly snapshot form, validation UX, and derived field preview for pipeline velocity.

## Data model

The database stores one logical snapshot per `workspace_id + week_of`, but each save creates a revision.

### Tables

- `workspaces`
- `snapshots`
- `snapshot_revisions`
- `metric_targets`
- `alert_subscriptions`

### Snapshot behavior

- The visible timeline always shows the latest revision for each week.
- Saving an existing `weekOf` does not destroy prior versions.
- Revision history is available through the revisions API route.

## Derived metric behavior

### Pipeline velocity

`pipelineVelocity` is no longer treated as a manually curated field in the form.

How it works:

1. The form watches `pipelineValue`, `salesCycleDays`, and `closeRatePct`.
2. `calculatePipelineVelocity()` in `lib/kpi-dashboard.ts` uses saved history to fit a lightweight regression model.
3. If there is not enough history for regression, it falls back to a median historical scale factor.
4. The server recalculates `pipelineVelocity` before persistence, so the saved value stays consistent even if a caller posts a manual number.

Why this exists:

- It removes a repetitive manual input.
- It keeps new snapshots aligned with the historical pattern already saved in the dashboard.

## Forecast behavior

`buildDashboardForecast()` projects a directional estimate for selected metrics:

- `pipelineValue`
- `pipelineVelocity`
- `closeRatePct`
- `customerAcquisitionCost`
- `feedRetentionPct`

Implementation details:

- Uses the latest 12 saved weekly snapshots
- Fits a simple linear trend by time index for each metric
- Projects one week ahead (`+7d`) and roughly 30 days ahead (`+30d`)
- Clamps values to the metric bounds from `metricFieldMap`

This is intentionally lightweight and explainable. It is meant for operational planning, not financial commitment.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000/dashboard`.

## Build, lint, test

```bash
npm run lint
npm run build
npm run test
```

## Data files and environment overrides

Default files:

- SQLite DB: `data/revops-dashboard.db`
- Legacy JSON seed: `data/weekly-metrics.json`

Optional overrides:

```bash
REVOPS_DASHBOARD_DB_PATH=/custom/path/revops-dashboard.db
REVOPS_LEGACY_SNAPSHOT_PATH=/custom/path/weekly-metrics.json
```

The tests use these environment variables to isolate temporary databases.

## Common maintenance tasks

### Add or change a metric

1. Update the metric schema and metadata in `lib/kpi-dashboard.ts`.
2. Update any chart or card usage in `components/dashboard-workspace.tsx`.
3. Update the weekly form in `components/weekly-update-form.tsx` if the metric is editable.
4. Update tests and docs.

### Change forecast behavior

1. Edit `lib/dashboard-forecast.ts`.
2. Keep the model explainable and bounded.
3. Update user-facing wording if the interpretation changes.
4. Add or update tests in `lib/dashboard-forecast.test.ts`.

### Change revision storage

1. Start in `lib/dashboard-db.ts`.
2. Preserve migration safety from `data/weekly-metrics.json`.
3. Keep `listWeeklySnapshots()` returning only latest revisions.
4. Keep the revisions route contract intact.

## Known constraints

- The dashboard is currently single-workspace in practice, even though the DB schema supports workspaces.
- The main dashboard component is still large. Prefer extracting helper cards or sections instead of adding more inline complexity.
- Some legacy helper files may exist before a UI is fully wired. Confirm usage before removing them.
