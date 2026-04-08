# RevOps Dashboard Maintenance Guide

This is the working guide for maintaining this project.
It focuses on real maintenance tasks, not product planning.

## What this app does

- Tracks weekly RevOps performance.
- Main route is /dashboard.
- Root route / redirects to /dashboard.
- Uses local browser storage (no backend yet).

## Quick commands

Run from repository root:

```bash
npm install
npm run dev
```

Open http://localhost:3000/

Before every deploy or PR:

```bash
npm run build
```

If build fails, stop and fix before pushing.

## How data is stored

The app stores everything in localStorage.

- revops_weekly_entries: weekly entries
- revops_custom_fields: dynamic field definitions
- revops_hidden_metrics: hidden metric ids

Important behavior:

- Mock data is seeded only if revops_weekly_entries is missing.
- Deleting a custom metric removes its values from stored weekly entries.
- Hidden metric ids are stored separately, so a metric can be restored later.

## Main files to know

- src/app/page.tsx: root redirect
- src/app/dashboard/page.tsx: dashboard tab rendering
- src/components/app-sidebar.tsx: tab ids and sidebar items
- src/components/data-entry-form.tsx: weekly input form and metric studio
- src/components/revops-kpi-cards.tsx: top KPI cards
- src/components/revops-charts.tsx: chart rendering and metric selection
- src/components/revops-weekly-table.tsx: weekly table
- src/lib/revops-data.ts: data types, storage keys, storage helpers
- src/lib/revops-context.tsx: app state and actions

## Normal maintenance workflow

1. Pull latest code.
2. Run npm run dev and check /dashboard loads.
3. Make your change.
4. Run npm run build.
5. Verify key flows still work:
	- switch tabs
	- add/update weekly entry
	- create, edit, hide, restore, delete dynamic metric
6. Push only related files.

## Updating metrics

### Dynamic metrics (no code changes)

Use Enter Data -> Metric Studio.

You can:

- create a custom metric
- set type number or text
- set optional suffix
- hide and restore metric
- delete custom metric

After updates, verify it shows in:

- Enter Data form
- Overview cards
- Data Table
- chart metric selector (number metrics)

### Static base metrics (code changes)

When adding or renaming a built-in metric, check all of these:

1. src/lib/revops-data.ts
2. src/components/data-entry-form.tsx
3. src/components/revops-kpi-cards.tsx
4. src/components/revops-charts.tsx
5. src/components/revops-weekly-table.tsx

If monthly aggregations are affected, also update computeMonthlyRollups in src/lib/revops-data.ts.

## Updating tabs

When adding a new dashboard tab, update both:

1. src/components/app-sidebar.tsx (TabId union + nav item)
2. src/app/dashboard/page.tsx (title map + render block)

If one side is missing, tab behavior will break.

## Local storage reset and debug

Use browser devtools only in local development.

Common debug actions:

- remove revops_weekly_entries to reseed initial mock data
- remove revops_custom_fields if metric definitions are corrupted
- remove revops_hidden_metrics if visibility gets stuck

You can also export values before deleting them when debugging user reports.

## Vercel maintenance notes

- Keep vercel.json in the repo.
- Framework must stay Next.js.
- Do not commit .vercel metadata files.

If production returns 404 on every route:

1. Confirm vercel.json exists in deployed commit.
2. Confirm Vercel project framework is Next.js.
3. Redeploy with build cache cleared.
4. Check build logs include generated routes for / and /dashboard.

## Release checklist

- npm run build passes
- /dashboard loads locally
- all tabs open correctly
- dynamic metric flow works end to end
- no accidental config or lockfile churn in commit
