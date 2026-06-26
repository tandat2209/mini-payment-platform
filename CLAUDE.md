# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common commands

Install and start the local stack:

```bash
pnpm install
pnpm db:up
pnpm db:setup
pnpm dev
```

Run individual services:

```bash
pnpm dev:api          # Nest API on http://localhost:3001
pnpm dev:web          # Vite web app on http://localhost:5173
pnpm dev:psp-sandbox  # fake PSP service on http://localhost:3002
```

Validate the repo:

```bash
pnpm check            # lint + typecheck + format check + tests
pnpm build
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test
```

Database commands:

```bash
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm db:setup         # migrate + deterministic seed data
pnpm db:logs
pnpm db:down
pnpm --filter @payment-platform-mini/db verify
```

Run package-specific checks:

```bash
pnpm --filter api test
pnpm --filter psp-sandbox test
pnpm --filter web verify:connectivity
```

Run a single Node test file or test name:

```bash
pnpm --filter api exec node --test -r ts-node/register src/customer-api.e2e.spec.ts
pnpm --filter api exec node --test -r ts-node/register --test-name-pattern "creates a payout" src/customer-api.e2e.spec.ts
pnpm --filter psp-sandbox exec node --test -r ts-node/register src/payouts/payouts.service.spec.ts
```

Reset the local database volume when seed state needs to be rebuilt from scratch:

```bash
docker compose down -v
pnpm db:up
pnpm db:setup
```

## Architecture overview

This is a pnpm/Turborepo TypeScript monorepo for a miniature payment platform. It demonstrates multi-currency wallets, double-entry ledger posting, payout orchestration, PSP webhooks, and reconciliation workflows.

### Runtime apps

- `apps/api` is the main NestJS backend. `src/app.module.ts` wires feature modules for customer access, wallets, transactions, funding, recipients, payouts, payout webhooks, ledger, operations/admin reads, reconciliation reports, and health.
- `apps/web` is a Vite + React 19 SPA. It uses TanStack Router for routes, TanStack Query for server state, feature folders for customer/admin/sandbox screens, and a shared API client in `src/lib/api-client.ts` plus endpoint wrappers in `src/api.ts`.
- `apps/psp-sandbox` is a NestJS fake provider. It accepts payout submissions from the API and exposes simulation endpoints for funding, payout updates/returns, beneficiary registration, and reconciliation reports. Simulation endpoints call back into the API using `PSP_SANDBOX_TARGET_API_BASE_URL`.
- `packages/db` owns PostgreSQL migrations, deterministic seed data, and schema verification scripts. The live apps use raw `pg` access rather than an ORM.

### Backend layering

The API is organized by domain module. Most non-trivial modules follow this shape:

- `presentation/` contains customer/admin/webhook controllers and DTOs.
- `application/` contains use cases and read queries.
- `domain/` contains interfaces, tokens, and domain types.
- `infrastructure/` contains SQL repositories or provider gateways.

Dependencies are bound in each module with Nest provider tokens; for example payout use cases depend on domain repository/gateway tokens and `PayoutsModule` maps them to SQL repositories and the PSP sandbox gateway. Keep this pattern when adding a feature instead of injecting concrete SQL classes directly into application services.

Database access is centralized through `DatabaseService`, which wraps a `pg.Pool`, and `DatabaseTransactionManager`, which exposes transaction contexts. Financial writes that update wallet balances, user transactions, payouts, and ledger entries should be performed inside one transaction so the wallet view and ledger truth stay consistent.

### Financial model and invariants

`packages/db/migrations` is the source of truth for tables. Important concepts are:

- Wallet balances are per wallet and currency; money is stored as integer minor units with explicit currencies.
- `user_transactions` are customer-facing payment/funding history and statement inputs.
- `ledger_transactions` and `ledger_entries` are the accounting source of truth. Ledger postings should balance debits and credits and are append-only; use compensating entries rather than editing historical ledger rows.
- Payout execution is tracked separately from user-visible transactions through `payouts` and `payout_attempts`.
- Provider evidence is stored in `webhook_events`; webhook uniqueness is by `(provider, external_event_id)`.
- Idempotency is modeled with scoped keys in `idempotency_keys`.
- Reconciliation uses provider reports/lines, webhook evidence, payout attempts, and ledger transactions; `user_transactions` are not the primary reconciliation anchor.

Run `pnpm --filter @payment-platform-mini/db verify` after migration or seed changes. The verifier applies migrations/seeds in memory and checks schema invariants and representative queries.

### Local configuration

Environment examples are in each app:

- API: `apps/api/.env.example` (`PORT`, `FRONTEND_ORIGIN`, `DATABASE_URL`, `PSP_SANDBOX_BASE_URL`)
- Web: `apps/web/.env.example` (`VITE_API_BASE_URL`, `VITE_PSP_SANDBOX_BASE_URL`, `VITE_CUSTOMER_EXTERNAL_REF`)
- PSP sandbox: `apps/psp-sandbox/.env.example` (`PORT`, `PSP_SANDBOX_TARGET_API_BASE_URL`)

Defaults are set for local development: Postgres is `postgresql://postgres:postgres@localhost:5432/payment_platform_mini`, the API is on port 3001, the web app on 5173, and the PSP sandbox on 3002. The web API client sends `x-customer-external-ref` from `VITE_CUSTOMER_EXTERNAL_REF` and defaults to `user_demo_alice`.

### Useful docs

Project docs under `docs/` explain flows that span multiple modules:

- `docs/financial-er-diagram.md` for the schema and accounting relationships.
- `docs/customer-api-reads.md` and `docs/customer-web-dashboard.md` for customer-facing reads/UI behavior.
- `docs/admin-operations-console.md` for admin read models and operational views.
- `docs/recipient-capability-discovery.md` for backend-driven recipient onboarding fields.
- `docs/payout-return-workflow.md` for paid-to-returned payout lifecycle and ledger effects.
