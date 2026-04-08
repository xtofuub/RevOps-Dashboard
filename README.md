# RevOps Dashboard (Next.js)

RevOps dashboard for weekly sales, product, and delivery tracking.

## Local run

From repository root:

```bash
cd app
npm install
npm run dev
```

Open:

- http://localhost:3000/dashboard

## Main tabs

- Overview: KPI cards + trend charts
- Revenue Engine
- Product-Market Signals
- Delivery Stability
- Data Table
- OKR Questions
- Enter Weekly Data

## Dynamic metrics (no backend code changes)

In Enter Weekly Data:

- Section D: Dynamic Metrics Wall (active metric inputs)
- Section E: Metric Studio (create, customize, hide, restore, delete custom)

Flow:

1. Enable optional example metrics or add a custom metric
2. Select type (`number` or `text`) and optional suffix
3. Save weekly values
4. Customize label/type/suffix from the Customize tab
5. Hide or restore metrics any time
6. Delete custom metric when no longer needed

The new metric appears automatically in:

- Enter Data form
- Overview KPI cards
- Data Table (weekly)
- Charts metric selector (`number` fields)

## Storage model

Data currently uses browser localStorage:

- `revops_weekly_entries`: weekly entries
- `revops_custom_fields`: dynamic field definitions
- `revops_hidden_metrics`: hidden metric ids

## Documentation

Project-level maintenance notes and production-data ideas are in:

- ../REVOPS_DOCUMENTATION.md
