# Payment Platform Mini

A mini payment platform demonstrating a multi-currency wallet, double-entry ledger, and payout orchestration system.

This project focuses on correctness and system design, inspired by real-world payment systems such as Stripe and Adyen, rather than UI complexity.

Reference: [Designing a Payment System](https://newsletter.pragmaticengineer.com/p/designing-a-payment-system)

## Development Setup

```bash
pnpm install
pnpm db:up
pnpm db:setup
pnpm dev
```

Financial schema verification:

```bash
pnpm --filter @payment-platform-mini/db verify
```

Optional local environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/simulator/.env.example apps/simulator/.env
```

The default API database URL already matches the local Docker Compose database:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/payment_platform_mini
```

Local Postgres commands:

```bash
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm db:setup
pnpm db:logs
pnpm db:down
```

If you need a clean local database volume, run:

```bash
docker compose down -v
```

`pnpm db:setup` applies the current SQL migration and then loads the deterministic seed scenario into the local Postgres database.

Default local ports:

- API: `http://localhost:3001`
- Web: `http://localhost:5173`
- Simulator: `http://localhost:3002`

## Overview

This system allows:

- Users to hold funds in a multi-currency wallet
- Internal money movement using a double-entry ledger
- Creating payment events (user-visible transactions)
- Splitting payments into fee plus principal
- Sending money externally via a payout system backed by a bank simulator

## Current Milestone

The current implementation foundation now includes:

- `apps/api` with a single health endpoint
- `apps/web` that can connect to the API
- `apps/simulator` as the future fake PSP/bank simulator scaffold
- `packages/db` with the initial financial schema migration, deterministic seed scenarios, and executable schema verification

Wallet services, payout orchestration, ledger posting logic, and reconciliation workers will be added in later changes.

## Core Concepts

### 1. Wallet

- Each user has one wallet
- Each wallet supports multiple currencies
- Each currency has its own balance

### 2. Ledger (Source of Truth)

- All money movement is recorded using double-entry accounting
- Ledger is append-only
- Every transaction must balance:
  - total debit = total credit

### 3. Payment Event

- Represents a user-visible transaction
- Example:
  - `Payout: 32 USD`

### 4. Accounts

- Internal accounting buckets:
  - Wallet accounts
  - Platform revenue
  - Recipient payable
  - Platform cash

### 5. Payout

- Represents external settlement
- Sends money to bank or payment rails (simulated)

## Example Flow

### Scenario

Client initiates a payout:

- Total: `32 USD`
- Fee: `30 USD`
- Recipient receives: `2 USD`

### What client sees

```text
Payout: 32 USD
```

## Ledger Entries

### Step 1 - Deduct + allocate

```text
Debit   Client Wallet           32
Credit  Platform Revenue        30
Credit  Recipient Payable        2
```

### Step 2 - Payout (external)

```text
Debit   Recipient Payable        2
Credit  Platform Cash            2
```

## Data Model

### Core Tables

- User
- Wallet
- Wallet Balance (per currency)
- Account (ledger accounts)
- Payment Event (user-facing)
- Ledger Entry (double-entry accounting)
- Payout (external transfer)

## Architecture

This project uses a single-repo (monorepo) structure:

```text
payment-platform-mini/
  apps/
    api/        # backend (wallet, ledger, payments)
    web/        # simple UI
    simulator/  # fake bank / payout system
  packages/
    db/         # schema + seed data
    shared/     # types/constants
  docs/
```

Current database design reference:

- [Financial ER Diagram](/Users/datnguyen/Projects/mini-payment-platform/docs/financial-er-diagram.md)

## System Flow

```text
User Wallet
    ↓
Payment Event
    ↓
Ledger Entries (double-entry)
    ↓
Recipient Payable
    ↓
Payout → Fake Bank → Recipient
```

## Key Design Principles

### Double-entry accounting

- Every transaction must balance

### Ledger is append-only

- Never update past entries
- Use new entries for reversals

### Separation of concerns

- Wallet = user view
- Ledger = accounting truth
- Payout = external movement

### Idempotency

- Prevent duplicate charges or payouts

### Atomic operations

- Wallet updates and ledger entries must happen in one transaction

### Minor units

- Store money as integers
- `32.00 USD` -> `3200`

## Fake Bank Simulator

A simple service that simulates:

- payout success or failure
- delayed settlement
- webhook or callback behavior (optional)

This allows testing:

- retries
- reconciliation
- failure handling

## Local Funding Flow

The inbound funding demo now models a provider-style webhook rather than an internal funding-detail reference.

1. Open the customer dashboard at `http://localhost:5173` and click `Add money`.
2. Copy one of the active funding identifiers shown on the page:
   - `accountNumber` for `destinationType: "account_number"`
   - `iban` for `destinationType: "iban"`
3. Trigger the simulator webhook:

```bash
curl -X POST http://localhost:3002/simulate/funding \
  -H 'content-type: application/json' \
  -d '{
    "amountMinor": 2500,
    "currency": "USD",
    "destinationType": "account_number",
    "destinationIdentifier": "1234567890",
    "description": "Salary top up",
    "providerReference": "bank-ref-001",
    "sender": {
      "name": "Alice Nguyen",
      "accountIdentifier": "99887766",
      "bankName": "Vietcombank",
      "bankCode": "VCB"
    },
    "externalEventId": "evt_funding_replay_test_001"
  }'
```

4. Trigger the same command again to verify replay handling. The second response should include `duplicate: true`.
5. Verify the resulting records in the local database:
   - `webhook_events` contains one provider event for the given `externalEventId`
   - `wallet_balances` reflects the credited amount
   - `user_transactions` contains one `funding` credit
   - `ledger_transactions` contains one `funding` posting
   - `ledger_entries` contains one debit to platform cash and one credit to wallet liability

Example SQL checks:

```sql
select provider, external_event_id, processing_status, processed_at
from webhook_events
where external_event_id = 'evt_funding_replay_test_001';

select wallet_id, currency, available_amount_minor
from wallet_balances
where wallet_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2';

select id, type, direction, description, reference, gross_amount_minor
from user_transactions
where reference = 'funding-evt_funding_replay_test_001';

select id, transaction_type, description, reference
from ledger_transactions
where reference = 'funding-evt_funding_replay_test_001';

select ledger_account_id, direction, amount_minor, description
from ledger_entries
where ledger_transaction_id in (
  select id
  from ledger_transactions
  where reference = 'funding-evt_funding_replay_test_001'
);
```

## Goals

This project demonstrates:

- Designing a wallet system
- Implementing a ledger with accounting correctness
- Modeling real payment flows
- Handling fee plus principal split
- Integrating with external settlement systems

## Future Improvements

- Multi-currency FX conversion
- Refunds or reversals
- Reconciliation jobs
- Webhook handling
- Rate limiting or fraud checks
- Event sourcing or audit logs

## Key Takeaway

> Wallet shows money. Ledger moves money. Payout sends money.

## Why This Project?

This is a learning and portfolio project to demonstrate:

- backend system design
- financial correctness
- real-world payment architecture thinking
