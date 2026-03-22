# Customer Web Dashboard

This document describes how to run and verify the customer-facing dashboard in `apps/web`.

## Prerequisites

1. Start PostgreSQL:

```bash
pnpm db:up
```

2. Apply the schema and seed data:

```bash
pnpm db:setup
```

3. Start the API:

```bash
pnpm dev:api
```

4. In a second terminal, start the web app:

```bash
pnpm dev:web
```

## Web Environment

Set these values in `apps/web/.env` when running locally:

```bash
VITE_API_BASE_URL=http://localhost:3001
VITE_CUSTOMER_EXTERNAL_REF=user_demo_alice
```

The seeded demo customer `user_demo_alice` exposes the richest overview data.

## What To Expect

When the dashboard loads successfully you should see:

- a persistent customer shell with sidebar navigation and top context bar
- a hero area showing the active wallet and primary balance
- KPI cards for available funds, pending funds, recent inflow, and recent outflow
- recent transactions in the main activity area
- supporting panels for currency balances, recipients, and statements

## Fallback Verification

The dashboard is designed to keep rendering its shell even when data cannot be loaded.

To verify the degraded state:

1. Stop the API after the page has loaded once, or point `VITE_API_BASE_URL` at an unavailable host.
2. Refresh the page.
3. Confirm the shell still renders and each section shows its own fallback message instead of a blank screen.

## Connectivity Script

With the API running locally, you can verify the web app render path with:

```bash
pnpm --filter web verify:connectivity
```
