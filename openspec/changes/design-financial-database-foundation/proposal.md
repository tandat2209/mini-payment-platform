## Why

The project now has a runnable technical foundation, but the financial system cannot be implemented safely until the database model and domain invariants are defined clearly. We need a schema that separates user-facing transactions, internal accounting, payout execution, and provider integration so future wallet, funding, payout, and reconciliation features are correct by design.

## What Changes

- Define the core wallet and balance data model, including one active wallet per user and multi-currency balances.
- Define the user-facing transaction model that powers app history and downloadable statements.
- Define the recipient and payout data model, including payout fees, net settlement amounts, and support for synchronous and asynchronous rails.
- Define the double-entry ledger model, including accounts, transaction containers, and append-only ledger entries stored in minor units.
- Define the webhook, idempotency, and reconciliation data model needed to process PSP messages safely and reconcile provider reports against internal financial truth.
- Document database invariants, lifecycle states, and relationships between wallet state, user-visible transactions, payout workflow, and ledger posting.

## Capabilities

### New Capabilities
- `wallets`: Define wallet lifecycle, funding details, and multi-currency balance requirements for users.
- `user-transactions-and-statements`: Define the user-facing transaction model that supports app history and statements.
- `payouts-and-recipients`: Define payout, recipient, and payout-attempt requirements for external money movement.
- `ledger`: Define the append-only double-entry ledger and posting invariants.
- `provider-integration-and-reconciliation`: Define webhook ingestion, idempotency, and reconciliation requirements for PSP integrations.

### Modified Capabilities
- None.

## Impact

- Affects `packages/db` schema design, future migrations, and seed strategy.
- Shapes API contracts for wallets, funding ingestion, payouts, recipients, transaction history, and reconciliation workflows.
- Establishes the system-of-record boundaries between user-facing transaction history, external PSP events, and internal ledger posting.
- Introduces financial correctness rules around minor-unit storage, append-only posting, state transitions, and idempotent integration processing.
