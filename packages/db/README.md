# Database Package

This package contains the financial schema foundation for the payment platform mini project.

## Contents

- `migrations/0001_financial_foundation.sql`
  Initial PostgreSQL schema for wallets, balances, user transactions, payouts, recipients, webhooks, idempotency, and ledger posting.
- `migrations/0002_recipient_onboarding_foundation.sql`
  Recipient-rail lifecycle and provider-registration foundation for pre-payout recipient onboarding.
- `seeds/001_financial_scenarios.sql`
  Deterministic seed scenarios covering wallet lifecycle, inbound funding recognition, and payout attempts.
- `scripts/apply-sql-file.mjs`
  Runtime SQL executor for applying migrations to a real PostgreSQL database via `DATABASE_URL`.
- `scripts/seed-if-needed.mjs`
  Applies deterministic seed data only when it is not already present, so repeated local or Docker setup runs can reuse a persistent database volume.
- `scripts/verify-schema.mjs`
  In-memory verification script that applies the migration and seed data, then checks the schema invariants and representative queries.

## Local Commands

Run against the local Docker Postgres instance or any database pointed to by `DATABASE_URL`:

- `pnpm migrate`
- `pnpm seed`
- `pnpm setup`

Default connection string:

```bash
postgresql://postgres:postgres@localhost:5432/payment_platform_mini
```

## Core Invariants

- At most one active wallet may exist per user.
- Each wallet may have at most one balance row per currency.
- Monetary values are stored in integer minor units with explicit currency.
- Payouts store gross, fee, and net amounts, with `gross = fee + net`.
- Webhook events are unique per `(provider, external_event_id)`.
- Idempotency keys are unique per `(scope, key)`.
- Ledger entries are append-only records linked to ledger transactions and accounts.

## Reconciliation Intent

Provider reconciliation is expected to use:

- `payout_attempts` for provider execution history
- `webhook_events` for inbound provider evidence
- `ledger_transactions` and `ledger_entries` for internal financial truth

`user_transactions` is the customer-facing history and statement source, not the primary reconciliation anchor.
