# Payment Platform Mini

A mini payment platform demonstrating a multi-currency wallet, double-entry ledger, and payout orchestration system.

This project focuses on correctness and system design, inspired by real-world payment systems such as Stripe and Adyen, rather than UI complexity.

Reference: [Designing a Payment System](https://newsletter.pragmaticengineer.com/p/designing-a-payment-system)

## Development Setup

```bash
pnpm install
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
