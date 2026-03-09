# Hipe-Strategic Dashboard — Action Steps

Use this as the exact implementation checklist.

## 1) Install MCP servers

Run:

- `npx -y @shadcn/mcp-server`
- `npx -y @magic-ui/mcp-server`

## 2) Set up project stack

- Framework: Next.js 14 (App Router)
- UI: Shadcn + Magic UI
- Charts: Recharts (via Shadcn chart components)
- Database: Supabase or PostgreSQL

## 3) Define data model (weekly records)

Create one table for weekly entries with at least:

- `id`
- `week_number`
- `month`
- `section` (Revenue, Product, Delivery)
- `metric_name`
- `value` (numeric)
- `target_value` (numeric, optional)
- `notes` (text, for qualitative signals)
- `created_at`

## 4) Map metrics to sections

### Revenue
- New Customers
- Pipeline Value (€)
- Close Rate (%)
- Sales Cycle (Days)

### Product
- Feed-retention (%)

### Delivery
- Sent Quotes
- Received Orders
- SLA (%)
- Incident Count
- Meetings/AM

### Qualitative signals (store in `notes`)
- Häviämisyy #1–#3
- Asiakaspyynnöt #1–#3

## 5) Build Tab 1: Weekly Pulse (input mode)

- Create a dark Shadcn table/form for weekly manual entry.
- Support inline editing (`Enter` to submit cell).
- Add validation coloring:
  - Red if below previous period
  - Green if above previous period
- Add a primary button: **Publish Weekly Metrics** (Magic UI Shiny Button).

## 6) Implement push flow

On publish:

1. Save weekly values + notes to database.
2. Revalidate/refetch chart data.
3. Trigger success feedback (Confetti or Border Beam pulse).

## 7) Build Tab 2: Performance Analytics

Layout in Bento-style cards:

- Revenue Engine: line/area charts (current vs previous month)
- Product-Market Signal: status cards for top loss reasons
- Delivery Stability: SLA + Incident visualizations (gauge/bar)

Add a `Weekly / Monthly` toggle.

## 8) Build Tab 3: Deep History

- Full-page Shadcn data table (or timeline).
- Show all weeks for the year.
- Add filters (at minimum: Delivery Stability).
- Tooltip on points/rows to reveal associated weekly notes.

## 9) Add executive summary (Boss Mode)

At top of dashboard, show dynamic summary text (Magic UI typing animation):

- Positive case: “Revenue Engine is performing above target this week.”
- Alert case: “Delivery Stability needs attention: incident count increased.”

## 10) Add critical-signal logic

Detect repeated qualitative issues:

- If same Häviämisyy #1 appears for 3 consecutive weeks,
- Mark it as **Critical Signal** in red on the Signal Wall.

## 11) Apply visual style rules

- Background: near-black
- Cards: dark glass style with subtle blur
- Labels: muted zinc tone
- Primary accent: purple for revenue visuals
- Use Magic UI effects only where they improve hierarchy (not everywhere)

## 12) Final QA checklist

- Weekly entry works end-to-end (input → save → refresh)
- All charts render from stored data
- History filter works for Delivery Stability
- Critical signal triggers correctly on 3-week repetition
- Executive summary changes based on metric direction


