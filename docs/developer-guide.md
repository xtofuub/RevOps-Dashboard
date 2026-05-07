# Developer Guide

## Stack

- Next.js 16 App Router
- React 19
- shadcn/ui with Base UI primitives
- Recharts for charts
- SQLite via `better-sqlite3`
- Local JSON user store with bcrypt password hashes
- Vitest for tests

Before changing framework behavior, read relevant local Next.js docs in `node_modules/next/dist/docs/`.

## High-level architecture

### App routes

- `app/dashboard/page.tsx`
  - Server component that loads snapshots, dashboard data, forecast data, and admin users when current session is admin.
- `app/admin/page.tsx`
  - Direct admin route for account management. Same admin panel also rendered inside `/dashboard` as admin-only workspace view.
- `app/admin/actions.ts`
  - Server actions for creating users, updating roles/names, resetting passwords, deleting accounts, and running guarded read-only SQL queries.
- `app/api/weekly-snapshots/route.ts`
  - `GET` returns timeline, dashboard summary, and forecast.
  - `POST` validates snapshot payload and stores new revision with signed-in user label when available.
- `app/api/weekly-snapshots/[weekOf]/revisions/route.ts`
  - Returns revision history for saved week.
- `app/api/export/weekly-snapshots/route.ts`
  - Builds and downloads Excel workbook.

### Core libraries

- `lib/kpi-dashboard.ts`
  - Source of truth for metric metadata, snapshot schemas, formatting helpers, and dashboard summary builders.
- `lib/dashboard-forecast.ts`
  - Produces directional `+7d` and `+30d` projections from latest saved weekly history.
- `lib/dashboard-db.ts`
  - Owns SQLite schema creation, migration from legacy JSON, revision persistence, and unused seed table cleanup.
- `lib/dashboard-store.ts`
  - Thin server-only adapter around DB layer.
- `lib/auth.ts`
  - Reads `session` cookie, resolves it against local user store, and returns current user.
- `lib/user-store.ts`
  - Server-only JSON-backed account store. Seeds default local accounts, hashes passwords with bcrypt, protects final admin account.
- `lib/dashboard-navigation.ts`
  - Shared workspace view metadata for dashboard tabs and admin panel view.
- `lib/admin-debug.ts`
  - Builds admin-only backend inspection data, table previews, counts, and recent revision summaries.
- `lib/admin-debug-types.ts`
  - Shared types for admin backend viewer and SQL console results.
- `lib/export-weekly-dashboard.ts`
  - Excel export builder.
- `lib/weekly-snapshot-csv.ts`
  - CSV parsing and template generation helpers.

### Main UI files

- `components/dashboard-workspace.tsx`
  - Dashboard views, charts, tables, range controls, forecast card, empty states, and admin workspace view.
- `components/app-sidebar.tsx`
  - Left navigation. Shows `Admin Panel` item only when `user.role === "admin"`.
- `components/site-header.tsx`
  - Header metadata for active workspace view.
- `components/weekly-update-form.tsx`
  - Weekly snapshot form, validation UX, and derived field preview for pipeline velocity.
- `components/export-workbook-button.tsx`
  - Excel export button. Hits `/api/export/weekly-snapshots`, streams blob to download.
- `components/require-auth.tsx`
  - Server component guard. Redirects unauthenticated users to login, and non-matching roles to dashboard.
- `components/user-nav.tsx`
  - User avatar and sign-out dropdown in sidebar footer.

## Authentication and admin accounts

Authentication intentionally lightweight for local/internal use.

- Login submits to `app/login/actions.ts`.
- Credentials verified by `verifyUserCredentials()` in `lib/user-store.ts`.
- App stores HTTP-only `session` cookie containing user id and username only.
- `auth()` resolves cookie against `data/users.json` on every request — role and name always reflect current user store state, so deleted or changed users stop matching immediately.

Default accounts created first time local user store initializes:

- `admin` / `admin123`
- `user` / `user123`

Admin panel supports:

- Create user accounts
- Edit display name and role
- Reset passwords
- Delete users
- Prevent deleting or demoting final admin
- Inspect backend table previews from frontend
- Review snapshot and revision history with human-readable labels
- Run read-only SQL queries through guarded presets or custom `SELECT` / read-only `PRAGMA` statements

Canonical local user file is `data/users.json`. It is ignored by git because it contains environment-specific account records and password hashes.

## Data model

Database stores one logical snapshot per `workspace_id + week_of`, but each save creates revision.

### Tables

- `workspaces`
- `snapshots`
- `snapshot_revisions`

### Table meaning

- `workspaces`
  - Workspace metadata. App currently runs as single workspace in practice.
- `snapshots`
  - One row per reporting week. `latest_revision_id` points to currently visible saved version.
- `snapshot_revisions`
  - Immutable saved versions for each week. Stores payload JSON, revision number, author label, and timestamp.

### Snapshot behavior

- Visible timeline always shows latest revision for each week.
- Saving existing `weekOf` does not destroy prior versions.
- Revision history available through revisions API route.
- Each revision stores `author_label` so admins can see who last saved each weekly version.

## Derived metric behavior

### Pipeline velocity

`pipelineVelocity` no longer treated as manually curated field in form.

How it works:

1. Form watches `pipelineValue`, `salesCycleDays`, and `closeRatePct`.
2. `calculatePipelineVelocity()` in `lib/kpi-dashboard.ts` uses saved history to fit lightweight regression model.
3. If not enough history for regression, it falls back to median historical scale factor.
4. Server recalculates `pipelineVelocity` before persistence, so saved value stays consistent even if caller posts manual number.

Why this exists:

- Removes repetitive manual input.
- Keeps new snapshots aligned with historical pattern already saved in dashboard.

## Forecast behavior

`buildDashboardForecast()` projects directional estimate for selected metrics:

- `pipelineValue`
- `pipelineVelocity`
- `closeRatePct`
- `customerAcquisitionCost`
- `feedRetentionPct`

Implementation details:

- Uses latest 12 saved weekly snapshots
- Fits simple linear trend by time index for each metric
- Projects one week ahead (`+7d`) and roughly 30 days ahead (`+30d`)
- Clamps values to metric bounds from `metricFieldMap`

This intentionally lightweight and explainable. Meant for operational planning, not financial commitment.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000/login`.

If testing from another device or VM through LAN address such as `http://10.5.0.2:3000/dashboard`, `next.config.ts` derives `allowedDevOrigins` from local IPv4 interfaces so development HMR requests are accepted.

## Production

```bash
npm install
npm run build
npm start
```

## Build, lint, test

```bash
npm run lint
npm run build
npm run test
```

## Data files and environment overrides

Default files:

- SQLite DB: `data/revops-dashboard.db`
- Local users: `data/users.json`
- Legacy JSON seed: `data/weekly-metrics.json`

Optional overrides:

```bash
REVOPS_DASHBOARD_DB_PATH=/custom/path/revops-dashboard.db
REVOPS_LEGACY_SNAPSHOT_PATH=/custom/path/weekly-metrics.json
```

Tests use these environment variables to isolate temporary databases.

## Common maintenance tasks

### Add or change metric

1. Update metric schema and metadata in `lib/kpi-dashboard.ts`.
2. Update chart or card usage in `components/dashboard-workspace.tsx`.
3. Update weekly form in `components/weekly-update-form.tsx` if metric editable.
4. Update tests and docs.

### Change forecast behavior

1. Edit `lib/dashboard-forecast.ts`.
2. Keep model explainable and bounded.
3. Update user-facing wording if interpretation changes.
4. Add or update tests in `lib/dashboard-forecast.test.ts`.

### Change revision storage

1. Start in `lib/dashboard-db.ts`.
2. Preserve migration safety from `data/weekly-metrics.json`.
3. Keep `listWeeklySnapshots()` returning only latest revisions.
4. Keep revisions route contract intact.

### Change admin behavior

1. Keep mutations in `app/admin/actions.ts` so every account change re-checks server-side admin session.
2. Keep local account persistence in `lib/user-store.ts`.
3. Keep in-dashboard view wired through `lib/dashboard-navigation.ts`, `components/app-sidebar.tsx`, and `components/dashboard-workspace.tsx`.
4. Revalidate both `/admin` and `/dashboard` after account mutations so direct route and workspace view stay fresh.
5. Keep SQL guardrails aligned between `app/admin/actions.ts` and `lib/admin-debug.ts` if query capabilities change.

## Known constraints

- Dashboard currently single-workspace in practice, even though DB schema supports workspaces.
- User store is local JSON, not production identity provider.
- Main dashboard component still large. Prefer extracting helper cards or sections instead of adding more inline complexity.
- Some legacy helper files may exist before UI fully wired. Confirm usage before removing them.
