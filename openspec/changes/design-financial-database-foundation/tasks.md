## 1. Financial Domain Schema Foundation

- [x] 1.1 Define the shared enums, status values, and core key conventions needed for wallets, user transactions, payouts, ledger records, webhook events, and idempotency records.
- [x] 1.2 Create the wallet tables and constraints for wallet lifecycle, one active wallet per user, per-currency wallet balances, and wallet funding details.
- [x] 1.3 Create the recipient tables and constraints so one recipient can store multiple rail-specific detail records.

## 2. User Transaction And Payout Schema

- [x] 2.1 Create the `user_transactions` table with statement-friendly fields for type, direction, status, timestamps, gross amount, fee amount, net amount, description, and references.
- [x] 2.2 Create the `payouts` table with user, wallet, recipient, rail, gross amount, fee amount, net amount, currency, and payout lifecycle state.
- [x] 2.3 Create the `payout_attempts` table with provider request identifiers, external references, attempt outcome fields, and linkage back to the business payout record.

## 3. Ledger And Integration Schema

- [x] 3.1 Create the `ledger_accounts`, `ledger_transactions`, and `ledger_entries` tables to support append-only double-entry posting in minor units with explicit currency.
- [x] 3.2 Create the `webhook_events` and `idempotency_keys` tables needed for duplicate-safe inbound processing and retry-safe outbound operations.
- [x] 3.3 Add foreign keys, uniqueness rules, and indexes that support provider-reference lookup, reconciliation queries, and atomic linkage between wallet, user transaction, payout, and ledger records.

## 4. Migration And Seed Coverage

- [x] 4.1 Generate the initial migration for the financial schema in `packages/db`.
- [x] 4.2 Add seed scenarios that cover an active wallet, multi-currency balances, inbound funding from a webhook, and a payout with fee-plus-net split and provider attempt history.
- [x] 4.3 Document the intended table relationships and invariant rules so later flow implementation uses the schema consistently.

## 5. Verification

- [x] 5.1 Validate that the schema enforces one active wallet per user and one balance row per wallet currency.
- [x] 5.2 Validate that webhook and idempotency uniqueness constraints block duplicate external processing records.
- [x] 5.3 Validate that the schema supports the required joins for user statements, payout operations, and provider reconciliation flows.
