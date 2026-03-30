## Why

The platform now handles payout submission, settlement, and failure, but it still has no model for a payout that settles successfully and is later returned by the provider or destination bank. We need that lifecycle before full reconciliation, because returned payouts are neither normal funding nor pre-settlement failures and must be handled as their own post-settlement reversal flow.

## What Changes

- Add a distinct payout return lifecycle for payouts that were previously paid and later come back from the provider, including full and partial returns.
- Add PSP sandbox support for payout return events so the return path can be simulated locally.
- Add API-side payout return ingestion that maps provider return events onto the matching payout attempt and payout business record.
- Add post-settlement return accounting that uses the actual returned amount and explicit fee-reversal policy instead of assuming the customer always receives the original gross debit back.
- Add customer-visible payout history behavior for returned payouts where the original payout debit remains in history with a returned final status and the actual returned amount is represented as a separate credit transaction.
- Add admin and provider integration support so returned payouts can be investigated as payout-return events rather than ordinary funding.

## Capabilities

### New Capabilities

- `psp-sandbox-payout-return-events-api`: Simulate provider payout return events for previously settled payouts.

### Modified Capabilities

- `payouts-and-recipients`: Payout lifecycle expands to include post-settlement returned outcomes in addition to submitted, processing, paid, and failed, including partial-return cases.
- `provider-integration-and-reconciliation`: Provider integrations now support payout return events as a distinct operational outcome rather than treating them as generic funding or simple failures.
- `ledger`: Returned payouts add post-settlement compensating ledger behavior after the original settlement entry.
- `user-transactions-and-statements`: Customer-visible payout history must represent returned payouts distinctly from failed payouts.
- `admin-operations-read-api`: Admin read models must expose returned payout state and linked operational context for investigation.

## Impact

- Affected code:
  - `apps/api/src/payouts`
  - `apps/api/src/ledger`
  - `apps/api/src/transactions`
  - `apps/api/src/operations`
  - `apps/psp-sandbox`
  - `apps/web/src/features/customer`
  - `apps/web/src/features/admin`
  - `packages/db`
- APIs:
  - new PSP sandbox payout return simulation endpoint(s)
  - new or expanded API-side payout provider callback ingestion for returns
  - expanded customer and admin payout reads to reflect returned lifecycle state
- Systems:
  - payout lifecycle state machine
  - payout attempts and provider event linkage
  - post-settlement ledger correction flow
  - customer transaction lifecycle
  - admin payout and reconciliation investigation
