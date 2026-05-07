# User Guide

## What this dashboard is for

RevOps Dashboard is weekly operating view for revenue health, retention signals, delivery stability, and customer feedback trends.

You use it to:

- review latest operating snapshot
- compare recent weeks
- save or revise Friday week-ending snapshot
- export saved history to Excel
- check short-term directional estimates for next 7 days and 30 days
- manage user accounts when signed in as admin

## Opening dashboard

Go to `/login`, then sign in. Navigating to `/` or `/dashboard` while signed out also redirects you there automatically.

For fresh local development setup, seeded accounts are:

- Admin: `admin` / `admin123`
- User: `user` / `user123`

After sign-in, main tabs are:

- `Overview`
- `Revenue Engine`
- `Product-Market Signal`
- `Delivery Stability`
- `Weekly Update`

Admins also see:

- `Admin Panel`

Clicking `Admin Panel` in left sidebar opens admin tools inside same dashboard. Browser stays on `/dashboard`.

## Admin Panel

Admin panel visible only to admin users.

Admins can:

- create user accounts
- delete user accounts
- edit user display name
- change user role between `Admin` and `User`
- reset user password
- inspect real backend tables from frontend
- review saved weekly report history and recent saved versions
- run read-only SQL queries with preset examples

Safety rules:

- You cannot delete account you are currently using.
- Dashboard keeps at least one admin account available.
- Password changes apply immediately.
- User account records are stored locally for running environment.
- SQL console blocks write queries and only allows read-only single-statement queries.

## Saving weekly snapshot

Open `Weekly Update` tab.

### Recommended workflow

1. Pick Friday that ends reporting week.
2. Use `Load from saved week` if you want to start from existing snapshot.
3. Update KPI fields for that reporting week.
4. Fill top 3 loss reasons.
5. Add repeated customer requests, one request per line.
6. Review stage flow values.
7. Click `Save weekly snapshot`.

### Important rules

- Use one snapshot per Friday week-ending date.
- If you save same Friday again, dashboard creates new saved version instead of overwriting old one.
- Latest saved version becomes active version shown in dashboard.
- Earlier saved versions stay in history.
- Admins can see who saved each version from backend view.

## Why pipeline velocity is automatic

`Pipeline velocity` now calculated for you.

Field updates automatically from:

- pipeline value
- close rate
- sales cycle
- saved historical snapshot patterns

You do not need to type it manually.

## Why browser showed "Please select a valid value"

That popup comes from browser number input validation.

It appears when typed number does not match field allowed increment size. Example:

- field using `step=50` rejects `3720`
- field using `step=1000` rejects `28100`

Dashboard now uses friendlier step for customer acquisition cost, and pipeline velocity is auto-calculated instead of manually typed.

## Using forecast

`Overview` tab includes `Forward estimate` card.

It shows:

- latest value
- projected `+7d` value
- projected `+30d` value

Use estimates as directional signal, not guaranteed outcome.

Best use cases:

- spotting whether momentum is improving or slipping
- preparing weekly operating reviews
- flagging likely CAC, retention, or pipeline changes early

## Trend range controls

Outside `Weekly Update` tab, dashboard range controls affect charts and ranked tables.

You can view:

- last 7 days
- last 30 days
- custom week-ending range

## Exporting data

Click the `Export Excel` button in the dashboard header. Downloads an Excel workbook of saved weekly snapshot history.

Export endpoint if needed directly: `/api/export/weekly-snapshots`

## Good data entry habits

- Keep loss reasons short and specific.
- Enter repeated requests consistently so trends stay readable week to week.
- Use same interpretation of each KPI every week.
- Prefer revising same Friday snapshot instead of creating duplicate weeks.

## If something looks wrong

Check these first:

- Is `weekOf` date Friday?
- Did you accidentally load wrong saved week as template?
- Are you reviewing correct trend range?
- Did you save new revision for existing week?

If data still looks off, ask developer to inspect:

- `/api/weekly-snapshots`
- `/api/weekly-snapshots/[weekOf]/revisions`
- SQLite database in `data/revops-dashboard.db`

## What backend tables mean

Admins may see these table names in backend viewer or SQL console:

- `workspaces` = dashboard workspace record. In this app usually one row.
- `snapshots` = one row per reporting week. Points to current live saved version for that week.
- `snapshot_revisions` = every saved version for every reporting week, including who saved it and when.
