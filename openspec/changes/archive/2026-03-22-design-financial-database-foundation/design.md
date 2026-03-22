## Context

The repository now has a working monorepo foundation, but the core financial domain is still undefined. The next milestone needs to establish a database design that can support wallet storage, inbound funding recognition, user-visible transaction history, outbound payouts, and reconciliation against provider reports without forcing later schema rewrites.

This system behaves like a payment platform that stores customer funds, receives inbound money from PSP callbacks, and sends outbound payouts to beneficiaries. That means the schema needs to separate product-facing records from accounting truth and from external-provider interaction history. It also needs to support financial-system best practices such as double-entry posting, append-only ledger entries, minor-unit amounts, idempotent external processing, and replay-safe webhook ingestion.

## Goals / Non-Goals

**Goals:**

- Define a wallet model that allows multiple wallets over time per user while enforcing a single active wallet.
- Define a multi-currency balance model that can support fast wallet reads without losing ledger correctness.
- Define a user-facing transaction model that can power app history and downloadable statements.
- Define a payout model that separates the business payout object from PSP submission attempts and supports both synchronous and asynchronous rails.
- Define a ledger model that enforces append-only double-entry accounting and per-currency balancing.
- Define webhook, idempotency, and reconciliation tables that support provider integrations and future report matching.

**Non-Goals:**

- Implement the application services, API endpoints, or orchestration logic for funding and payout flows.
- Finalize every provider-specific rail schema in this change.
- Build statement generation jobs or reconciliation workers in this change.
- Model FX conversion, reserves, holds, or advanced treasury features yet.

## Decisions

### Separate customer-visible transactions from accounting transactions

The schema will use `user_transactions` as the product-facing transaction history and statement source, while `ledger_transactions` and `ledger_entries` remain the accounting source of truth. This avoids leaking internal postings such as revenue, payable, and platform cash movements into the user experience.

Alternative considered:

- Use ledger entries directly for statements and UI history: simpler on paper, but too low-level for customer-facing activity and too tightly coupled to internal account structure.

### Model wallets as lifecycle objects and balances as per-currency rows

Users may have multiple wallets over time, but only one active wallet at a time. `wallets` will capture lifecycle state, while `wallet_balances` will store one row per `(wallet_id, currency)` for current balances. Balance rows are treated as a read model that must stay in sync with ledger postings.

Alternative considered:

- Keep one wallet forever per user: simpler, but does not support closed-and-reopened wallet history.
- Store all balances as dynamic JSON on the wallet row: harder to constrain and query reliably.

### Model recipients separately from recipient rail details

The schema will separate `recipients` from `recipient_rails` so one beneficiary can have multiple payout methods and rail-specific data shapes. Rail-specific details can start as structured JSONB with a type discriminator, leaving room to normalize later if necessary.

Alternative considered:

- Store all recipient details directly on the payout row: simpler initially, but duplicates mutable recipient data and makes reuse harder.
- Create a fully normalized table per rail from day one: more precise, but too heavy before the supported rails are stable.

### Model payouts separately from payout attempts

`payouts` will represent the business instruction to send money to a recipient, including gross amount, fee, net amount, state, and recipient linkage. `payout_attempts` will represent each PSP submission or retry, with provider request ids, external references, response states, and timestamps.

Alternative considered:

- Put all PSP attempt fields on the payout row: simpler, but loses retry history and makes reconciliation/debugging significantly harder.

### Use raw webhook storage plus idempotency records as the integration boundary

The initial schema will include `webhook_events` and `idempotency_keys` as the external integration boundary. Raw webhook events will be stored, deduplicated, and processed into internal records. For v1, inbound funding can be recognized from webhook events into wallet, ledger, and user transaction records without introducing a dedicated `funding_events` table yet.

Alternative considered:

- Add a first-class `funding_events` table now: useful if inbound funding immediately requires richer lifecycle handling, but not strictly necessary for the current scope.

### Reconciliation anchors on operational and accounting tables, not user history

External PSP reports will be reconciled primarily against `payout_attempts`, `webhook_events`, and `ledger_transactions` / `ledger_entries`. `user_transactions` remains a customer-facing history model and can be checked secondarily, but it is not the primary reconciliation target.

Alternative considered:

- Reconcile directly against `user_transactions`: easier to explain, but not strong enough for financial auditability because it omits provider retry history and internal account postings.

### All monetary storage uses minor units with explicit currency

Every monetary field will use integer minor units (`BIGINT`) with an explicit currency column. Ledger balancing rules will apply per currency, and no single ledger transaction may balance by mixing currencies.

Alternative considered:

- Decimal money fields: more familiar, but less reliable for exact arithmetic.

## Risks / Trade-offs

- [Risk] Deferring `funding_events` may make inbound funding workflows less explicit later. → Mitigation: keep provider references and webhook linkage strong enough that a dedicated funding table can be introduced in a later change if needed.
- [Risk] JSONB rail details may drift without validation. → Mitigation: use typed discriminators, documented schemas, and application-level validation before persisting.
- [Risk] Keeping `wallet_balances` as a read model introduces consistency requirements. → Mitigation: require wallet balance updates, user transaction writes, and ledger postings to occur in one database transaction.
- [Risk] User statement expectations may grow beyond `user_transactions`. → Mitigation: define `user_transactions` with statement-friendly fields now and add statement snapshot tables later if needed.

## Migration Plan

1. Define enums, tables, foreign keys, and uniqueness rules for wallets, balances, recipients, payouts, provider events, and ledger posting.
2. Add partial unique indexes and relational constraints that enforce financial invariants such as one active wallet per user and one balance row per wallet currency.
3. Add seed scenarios that cover active wallet lifecycle, inbound funding recognition, payout with fee plus net split, retryable payout submission, and asynchronous payout completion.
4. Add schema-level documentation or comments that describe reconciliation keys, external references, and posting boundaries.
5. Validate that the schema supports future application flows without requiring table redesign for the next implementation changes.

Rollback remains straightforward because this change defines net-new schema artifacts before production data exists.

## Open Questions

- Should the initial schema include statement snapshot tables immediately, or should downloadable statements be generated directly from `user_transactions` until performance or audit requirements justify snapshots?
- Should wallet funding details be stored as a separate reusable entity from day one, or is a wallet-scoped details table sufficient until more rails are supported?
- Do we want pending ledger transactions in the initial design, or should v1 allow only posted transactions plus compensating reversals?
