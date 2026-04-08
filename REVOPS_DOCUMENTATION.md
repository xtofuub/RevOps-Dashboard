# RevOps Dashboard Maintenance Guide

This is a simple guide for maintaining this project.

## Local run

From repository root:

```bash
npm install
npm run dev
```

Open `/dashboard` in the browser.

## Before you push

Always run:

```bash
npm run build
```

If build fails, do not deploy.

## Main files to know

- `src/app/page.tsx`: redirects `/` to `/dashboard`
- `src/app/dashboard/page.tsx`: main dashboard page
- `src/lib/revops-context.tsx`: shared state
- `src/lib/revops-data.ts`: localStorage read/write helpers
- `src/components`: dashboard UI blocks

## Data storage

The app uses browser localStorage:

- `revops_weekly_entries`
- `revops_custom_fields`
- `revops_hidden_metrics`

Data is local to the browser profile.

## Dynamic metrics

Metrics are managed in Enter Weekly Data.

You can:

- add custom metrics
- edit label, type, and suffix
- hide and restore metrics
- delete custom metrics

After changes, confirm the metric appears in:

- Enter Data form
- Overview cards
- Data table
- Chart metric selector (number fields)

## Vercel deploy notes

- Keep `vercel.json` in the repo.
- Framework must be Next.js.
- Do not commit `.vercel` metadata files.

If all routes return 404:

1. Confirm `vercel.json` is in the deployed commit.
2. Check project framework is Next.js.
3. Redeploy with build cache cleared.

## Quick release checklist

- `npm run build` passes
- `/dashboard` loads locally
- tab switching works
- dynamic metric create/edit/hide/restore/delete works
