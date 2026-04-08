# RevOps Dashboard

Weekly RevOps dashboard built with Next.js.

## Quick start

Run from repository root:

```bash
npm install
npm run dev
```

Open:

- http://localhost:3000/
- http://localhost:3000/dashboard

## Build check

```bash
npm run build
```

Run this before pushing changes.

## What this app tracks

- Revenue Engine
- Product-Market Signals
- Delivery Stability
- Weekly data table and questions

## Data storage

Data is stored in browser localStorage:

- `revops_weekly_entries`
- `revops_custom_fields`
- `revops_hidden_metrics`

## Deploy notes (Vercel)

- Framework must be Next.js.
- Keep `vercel.json` in the repo.
- Do not commit `.vercel` metadata files.

If production shows 404 for all routes, redeploy with cache cleared and confirm Next.js is detected.

## More docs

See `REVOPS_DOCUMENTATION.md` for the full maintenance guide.
