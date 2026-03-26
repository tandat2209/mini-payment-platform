## Why

The platform can now book a payout request internally, but it stops at `pending_submission` and never submits that payout to the PSP sandbox or progresses it through real provider outcomes. We need the next slice so outbound payouts behave like a real payment flow, with provider attempt history, asynchronous status handling, accounting follow-up after settlement or failure, and sandbox-owned activity records that can later drive end-of-day and reconciliation simulations.

## What Changes

- Add payout submission from the API to the PSP sandbox after payout booking, including persisted `payout_attempts` records and provider identifiers.
- Add PSP sandbox payout endpoints for create/submit behavior and payout-status callbacks so the sandbox can model synchronous acceptance plus asynchronous completion or failure.
- Add PSP sandbox-side persistence for payout submissions and payout events so the sandbox keeps a provider-style operational history instead of acting as a stateless mock.
- Add API-side payout status ingestion that maps provider updates onto payout and attempt state transitions.
- Add follow-up ledger and customer-transaction state handling for terminal payout outcomes:
  - settlement clears `recipient payables` against `platform cash`
  - failure reverses the booked payout impact back to the wallet and customer-facing transaction state
- Extend the customer payout experience to show truthful provider-progress states rather than stopping at local booking only.

## Capabilities

### New Capabilities

- `psp-sandbox-payout-events-api`: Simulate payout submission, provider identifiers, and asynchronous payout status callbacks for booked payouts.

### Modified Capabilities

- `payouts-and-recipients`: Payout lifecycle moves beyond booking into provider submission, attempt tracking, and terminal payout outcomes.
- `provider-integration-and-reconciliation`: Provider integrations now include outbound payout submission and payout-status callback ingestion in addition to funding and beneficiary registration.
- `ledger`: Payout settlement and payout failure add follow-up ledger postings beyond the initial booking entry.
- `user-transactions-and-statements`: Customer-visible payout transactions now progress through submitted, paid, or failed states based on provider outcomes.

## Impact

- Affected code:
  - `apps/api/src/payouts`
  - `apps/api/src/ledger`
  - `apps/api/src/transactions`
  - `apps/psp-sandbox`
  - `apps/web/src/features/customer`
  - `packages/db`
- APIs:
  - new PSP sandbox payout submission and payout update endpoints
  - new API-side payout provider callback ingestion endpoint(s)
  - expanded customer payout reads to reflect real lifecycle state
- Systems:
  - `payouts`
  - `payout_attempts`
  - ledger posting flow
  - user transaction lifecycle
  - PSP sandbox provider-activity storage
