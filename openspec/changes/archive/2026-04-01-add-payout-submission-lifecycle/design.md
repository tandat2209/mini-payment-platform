## Context

The current payout implementation books a payout request atomically inside the API:

- debit wallet available balance
- create `user_transactions`
- create `payouts`
- post the booking ledger transaction
- leave the payout in `pending_submission`

That gives us correct internal booking, but not a complete outbound flow. The PSP sandbox already supports inbound funding simulation and beneficiary registration, so the next bounded step is to let the payout domain submit booked payouts to that sandbox, record each provider attempt, and apply provider outcomes back into payout, transaction, wallet, and ledger state.

Because we also want to simulate later provider outputs such as end-of-day payout reports or reconciliation extracts, the sandbox should keep a database seam available. But it does not need its own payout-activity tables now; later report simulation can read from platform payout records such as `payouts` and `payout_attempts`.

This change crosses:

- payout write orchestration
- PSP sandbox contracts
- PSP sandbox payout simulation with optional database read seam
- provider callback ingestion
- ledger follow-up posting
- customer-visible payout status handling

so a short design is useful before implementation.

## Goals / Non-Goals

**Goals:**

- Submit newly booked payouts to the PSP sandbox using a dedicated payout-attempt flow.
- Persist `payout_attempts` with provider request and payout references.
- Support a realistic asynchronous lifecycle:
  - `pending_submission`
  - `submitted`
  - `processing`
  - `paid`
  - `failed`
- Ingest provider payout updates separately from initial booking.
- Post accounting follow-up entries:
  - settlement: `recipient payables -> platform cash`
  - failure: reverse the booked payout effect back into wallet liability
- Reflect provider outcomes in customer-visible payout transaction status.

**Non-Goals:**

- Treasury sweep handling for platform revenue or internal cash transfers.
- Manual retry tooling for failed payouts.
- Batch reconciliation-file ingestion for outbound payouts.
- Multi-provider routing or provider failover.
- Full end-of-day report generation UX.

## Decisions

### Decision: Keep payout booking and provider submission as separate internal steps

`POST /customers/me/payouts` should remain the business booking boundary. It will still create the payout, customer transaction, and booking ledger effects first, then trigger provider submission as the next step inside the same application service boundary.

Why:

- booking and provider submission are conceptually different operations
- it keeps customer-visible business objects stable even if provider submission fails
- `payout_attempts` remain the operational history rather than overloading `payouts`

Alternatives considered:

- Submit inline before persisting the payout: rejected because we would lose a durable business record when provider submission times out or partially succeeds.
- Delay all provider submission to a job queue first: rejected for this slice because it adds infrastructure complexity before we need it.

### Decision: Model the PSP sandbox as sync accept + async status callback

The PSP sandbox payout API should accept a payout submission and return provider references immediately, but terminal outcomes should be able to arrive later through a callback into the API.

Why:

- matches common real-provider behavior
- exercises `payout_attempts`, lifecycle transitions, and webhook handling cleanly
- keeps room for both instant-success and delayed-settlement rails

Alternatives considered:

- Immediate final result only: rejected because it skips the lifecycle work we actually need.
- Callback only with no submission response data: rejected because it weakens attempt observability and doesn’t feel like a real provider boundary.

### Decision: Keep the PSP sandbox lightweight and reuse platform payout data for later report simulation

The PSP sandbox should keep its database connection available, but it should not own separate payout-activity tables in this slice. Callback simulation and future report generation can read from platform-side records such as `payout_attempts` and `payouts`.

Why:

- avoids duplicating payout state across the sandbox and the platform
- keeps the sandbox lightweight while preserving a seam for future report generation
- reduces migration and storage complexity for a support app that is not the financial source of truth

Alternatives considered:

- Add sandbox-owned payout tables now: rejected because it duplicates state and complicates the simulator too early.
- Remove the DB seam entirely: rejected because later report simulation may reasonably need read access to platform payout history.

### Decision: Use one payout attempt per provider submission and keep attempts append-only

Every outbound provider call creates a distinct `payout_attempts` row with request payload, response payload, provider request id, provider payout id, status, and timestamps.

Why:

- preserves operational history for retries, reconciliation, and debugging
- aligns with the existing financial database model
- keeps retries append-only instead of overwriting history

Alternatives considered:

- Mutate one attempt row in place per payout: rejected because retries would destroy history.

### Decision: Apply settlement and failure as compensating accounting steps, never by mutating prior ledger history

The initial payout booking entry stays append-only. Later outcomes add new ledger transactions:

- settlement:
  - debit `recipient payables`
  - credit `platform cash`
- failure:
  - debit `recipient payables`
  - credit `wallet liabilities`
  - restore wallet available balance accordingly

Why:

- consistent with append-only ledger policy
- makes investigation and reconciliation easier
- avoids rewriting financial history

Alternatives considered:

- Mark booking ledger transaction as reversed only: rejected because the wallet balance and customer transaction still need explicit compensating treatment.

### Decision: Drive customer-visible payout status from payout lifecycle, not sandbox optimism

The customer app should show real payout states returned by the API:

- `submitted`
- `processing`
- `paid`
- `failed`

and stop implying success at booking time alone.

Why:

- avoids misleading money-movement UX
- keeps customer history aligned with provider state

## Risks / Trade-offs

- [Risk] Inline submission after booking increases application-service complexity. → Mitigation: keep provider submission in one narrow service and defer queues/retries to later slices.
- [Risk] Provider callbacks may arrive out of order or duplicate. → Mitigation: dedupe by provider event/request identifiers and guard terminal transitions carefully.
- [Risk] Failure reversal can become ambiguous if the provider outcome arrives after a later retry. → Mitigation: always link callbacks to `payout_attempts` and use payout-level state rules before applying financial reversal.
- [Risk] Settlement and failure accounting choices can grow more nuanced for real rails. → Mitigation: keep this slice limited to the current simple booking, settlement, and failure paths while documenting the assumptions.
- [Risk] A read-through sandbox depends on platform records being present before callbacks are simulated. → Mitigation: only use the DB seam for callback/report lookup after payout submission has already recorded `payout_attempts`.

## Migration Plan

1. Add PSP sandbox payout submission and payout callback contracts, keeping the sandbox lightweight while preserving a DB seam for later read-only reporting.
2. Add API payout submission gateway and `payout_attempts` persistence.
3. Update payout execution flow to submit after booking and move payout state to `submitted` or `processing`.
4. Add payout callback ingestion and transition handling for `paid` and `failed`.
5. Add settlement/failure ledger follow-up postings and customer transaction status updates.
6. Update the customer payout UI to show real provider lifecycle states.

Rollback approach:

- keep payout booking available even if provider submission must be disabled
- feature-disable submission path and leave payouts at `pending_submission` if the sandbox contract regresses

## Open Questions

- Should failed payouts restore the original customer reference, or add a distinct failure reference on reversal-linked records?
- Do we want the sandbox to support both immediate terminal success and delayed callbacks in the first slice, or only delayed callbacks plus an explicit test control?
- Should customer transaction history expose `processing` separately from `submitted`, or is one in-flight display state enough in the UI initially?
- Should the PSP sandbox later query platform payout records directly for report generation, or should we still introduce a provider-owned read model if reconciliation simulation becomes more advanced?
