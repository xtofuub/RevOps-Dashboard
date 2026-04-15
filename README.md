# RevOps Dashboard

A dark-themed Revenue Operations dashboard for tracking weekly business metrics across Revenue, Product, and Delivery — with historical analytics, executive summaries, and critical signal detection.

**Live Demo:** [rev-ops-dashboard.vercel.app/dashboard](https://rev-ops-dashboard.vercel.app/dashboard)

---

## Features

- **Weekly Pulse** — Manual metric entry with inline editing and automatic red/green validation against the previous period
- **Performance Analytics** — Bento-style charts (line, area, gauge, bar) with weekly/monthly toggles
- **Deep History** — Full-year data table with filters and per-row notes tooltips
- **Executive Summary** — Dynamic "Boss Mode" header that reads metric direction and surfaces alerts
- **Critical Signal Detection** — Flags recurring qualitative issues (e.g. repeated loss reasons) after 3 consecutive weeks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI Components | Shadcn UI + 21st.dev Magic UI |
| Charts | Recharts (via Shadcn chart primitives) |
| Database | Supabase / PostgreSQL |
| Language | TypeScript |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (or local PostgreSQL instance)

### Installation

```bash
git clone https://github.com/xtofuub/RevOps-Dashboard.git
cd RevOps-Dashboard
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Create a `weekly_metrics` table in Supabase with the following schema:

```sql
create table weekly_metrics (
  id uuid primary key default gen_random_uuid(),
  week_number integer not null,
  month text not null,
  section text not null,        -- 'Revenue' | 'Product' | 'Delivery'
  metric_name text not null,
  value numeric not null,
  target_value numeric,
  notes text,
  created_at timestamptz default now()
);
```

### Run Locally

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000/dashboard`.

---

## Metrics Tracked

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
- Meetings / Account Manager

### Qualitative Signals
Stored as weekly notes — top loss reasons and customer requests are tracked and surfaced on the Signal Wall when they repeat.

---

## Dashboard Tabs

### Tab 1 — Weekly Pulse
Enter and publish weekly metrics via an inline-editable dark table. Cells color-code automatically against the previous period. Hitting **Publish Weekly Metrics** saves to the database and refreshes all charts.

### Tab 2 — Performance Analytics
Three bento-card sections — Revenue Engine, Product-Market Signal, and Delivery Stability — each with chart breakdowns and a weekly/monthly toggle.

### Tab 3 — Deep History
A full data table showing all weeks for the year, filterable by section, with tooltips revealing the qualitative notes attached to each entry.

---

## Visual Style

- **Background:** Near-black
- **Cards:** Dark glass with subtle blur
- **Labels:** Muted zinc tones
- **Accent:** Purple for revenue visuals
- **Animations:** Magic UI effects used selectively for hierarchy

---

## Author

**xtofuub** — [github.com/xtofuub](https://github.com/xtofuub)
