# User Guide

## What this dashboard is for

The RevOps Dashboard is a weekly operating view for revenue health, retention signals, delivery stability, and customer feedback trends.

You use it to:

- review the latest operating snapshot
- compare recent weeks
- save or revise a Friday week-ending snapshot
- export the saved history to Excel
- check short-term directional estimates for the next 7 days and 30 days
- manage user accounts when signed in as an admin

## Opening the dashboard

Go to `/dashboard`.

Sign in with the account your admin gave you. For a fresh local development setup, the seeded accounts are:

- Admin: `admin` / `admin123`
- User: `user` / `user123`

The main tabs are:

- `Overview`
- `Revenue Engine`
- `Product-Market Signal`
- `Delivery Stability`
- `Weekly Update`

Admins also see:

- `Admin Panel`

Clicking `Admin Panel` in the left sidebar opens account management on the right side of the same dashboard. The browser stays on `/dashboard`.

## Admin Panel

The admin panel is visible only to admin users.

Admins can:

- create user accounts
- delete user accounts
- edit a user's display name
- change a user's role between `Admin` and `User`
- reset a user's password

Safety rules:

- You cannot delete the account you are currently using.
- The dashboard keeps at least one admin account available.
- Password changes apply immediately.
- User account records are stored locally for the running environment.

## Saving a weekly snapshot

Open the `Weekly Update` tab.

### Recommended workflow

1. Pick the Friday that ends the reporting week.
2. Use `Load from saved week` if you want to start from an existing snapshot.
3. Update the KPI fields for that reporting week.
4. Fill in the top 3 loss reasons.
5. Add repeated customer requests, one request per line.
6. Review the stage flow values.
7. Click `Save weekly snapshot`.

### Important rules

- Use one snapshot per Friday week-ending date.
- If you save the same Friday again, the dashboard creates a new revision.
- The latest revision becomes the active version shown in the dashboard.
- Earlier revisions are kept in history.

## Why pipeline velocity is automatic

`Pipeline velocity` is now calculated for you.

That field updates automatically from:

- pipeline value
- close rate
- sales cycle
- saved historical snapshot patterns

You do not need to type it manually.

## Why the browser showed “Please select a valid value”

That popup comes from the browser’s number input validation.

It appears when the typed number does not match the field’s allowed increment size. For example:

- a field using `step=50` rejects `3720`
- a field using `step=1000` rejects `28100`

The dashboard now uses a friendlier step for customer acquisition cost, and pipeline velocity is auto-calculated instead of manually typed.

## Using the forecast

The `Overview` tab includes a `Forward estimate` card.

It shows:

- latest value
- projected `+7d` value
- projected `+30d` value

Use these estimates as a directional signal, not a guaranteed outcome.

Best use cases:

- spotting whether momentum is improving or slipping
- preparing weekly operating reviews
- flagging likely CAC, retention, or pipeline changes early

## Trend range controls

Outside the `Weekly Update` tab, the dashboard range controls affect charts and ranked tables.

You can view:

- last 7 days
- last 30 days
- a custom week-ending range

## Exporting data

The dashboard supports Excel export through the weekly snapshot export route.

If export is wired to a button in your current build, use that button. Otherwise the export endpoint is:

- `/api/export/weekly-snapshots`

## Good data entry habits

- Keep loss reasons short and specific.
- Enter repeated requests consistently so trends stay readable week to week.
- Use the same interpretation of each KPI every week.
- Prefer revising the same Friday snapshot instead of creating duplicate weeks.

## If something looks wrong

Check these first:

- Is the `weekOf` date a Friday?
- Did you accidentally load the wrong saved week as a template?
- Are you reviewing the correct trend range?
- Did you save a new revision for an existing week?

If the data still looks off, ask a developer to inspect:

- `/api/weekly-snapshots`
- `/api/weekly-snapshots/[weekOf]/revisions`
- the SQLite database in `data/revops-dashboard.db`
