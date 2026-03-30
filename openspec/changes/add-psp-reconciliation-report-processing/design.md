## Context

The platform now supports payout booking, payout submission, payout attempts, provider callbacks, customer payout status, and treasury health checks. That gives us near-real-time operational state, but it still does not give us a provider-originated end-of-day truth source.

Real payment operations usually receive a daily reconciliation report from the PSP or banking partner. That report is not just another payout callback. It represents the provider's batch-level view of what it believes happened during a report window and is the basis for finance and operations to confirm:

- which payouts the provider believes were submitted, settled, failed, or returned
- whether provider identifiers and internal payout attempts line up
- whether booked internal state matches provider-reported status and amount
- which mismatches are harmless timing differences versus genuine exceptions

This change therefore crosses:

- PSP sandbox report simulation
- provider webhook ingestion
- new report storage and line-item storage
- payout attempt and payout matching
- ledger linkage
- admin reconciliation read models

so a short design is useful before implementation.

## Goals / Non-Goals

**Goals:**

- Accept PSP reconciliation report deliveries by webhook.
- Store raw report batches and parsed report lines durably.
- Deduplicate replayed report deliveries safely.
- Match each provider report line against internal payout attempts, payouts, webhooks, and ledger records.
- Produce explicit reconciliation outcomes per report line and explicit exception records where auto-match is not safe.
- Expose reconciliation report history and unresolved exceptions through admin read models.
- Define scenario-by-scenario reconciliation behavior for common payout-report cases.

**Non-Goals:**

- General ledger close or treasury sweep automation.
- Funding reconciliation in the same slice unless the sandbox later expands its report format.
- Fully automated correction or compensating ledger entries from reconciliation mismatches.
- CSV or file-upload ingestion outside the webhook path.
- Multi-provider normalization beyond the current PSP sandbox contract.

## Decisions

### Decision: Treat daily reconciliation reports as a separate provider artifact from payout callbacks

The system should model reconciliation reports separately from ordinary payout update webhooks. A payout callback communicates one event about one payout attempt, while a reconciliation report communicates provider truth for a report window and may include multiple payout lines in one batch.

Why:

- report batches need their own lifecycle, identifiers, and storage
- one report delivery can contain many payout lines
- reconciliation status is different from webhook processing status

Alternatives considered:

- Reuse existing `webhook_events` only with no separate report storage: rejected because batch identity, line status, and operational history would be difficult to query and explain.
- Reuse payout callback processing directly: rejected because a report line is evidence for reconciliation, not necessarily a new lifecycle event that should mutate payout state automatically.

### Decision: Store both raw report batches and normalized reconciliation lines

Each incoming report should create:

- one report batch record
- many report line records
- links back to the raw provider webhook payload

Why:

- raw payload preserves auditability
- normalized lines support deterministic matching and admin read models
- line-level statuses let operations work one exception without losing the batch context

Alternatives considered:

- Raw JSON only: rejected because matching and admin triage would become ad hoc parsing.
- Normalized lines only: rejected because we would lose exact provider evidence.

### Decision: Match report lines primarily to payout attempts, then to payouts and ledger context

Matching priority should be:

1. provider payout id / external payout id
2. provider request id / external request id
3. payout id or internal reference when explicitly carried
4. fallback operational match on currency, gross, fee, net, report date, and recipient/provider context

Once a payout attempt is matched, the reconciliation processor should also gather:

- payout business record
- customer transaction
- linked webhook events
- linked ledger transactions

Why:

- `payout_attempts` are the closest internal mirror of provider execution
- payout business objects alone are too coarse when retries exist
- ledger linkage is needed to reason about accounting follow-up

Alternatives considered:

- Match to payout only: rejected because retries or multiple attempts can make provider state ambiguous.
- Match to user transaction only: rejected because user transactions are customer-facing, not provider-facing.

### Decision: Reconciliation outcomes are explicit classifications, not implicit booleans

Each report line should end in one of a small set of explicit outcomes:

- `matched`
- `timing_difference`
- `status_mismatch`
- `amount_mismatch`
- `provider_only`
- `internal_only`
- `duplicate_provider_line`
- `unsupported_report_line`

Why:

- operators need to know what kind of problem they are looking at
- not every mismatch is equally urgent
- some cases should remain open without immediate financial mutation

Alternatives considered:

- simple matched / unmatched only: rejected because it hides the operational meaning of the gap.

### Decision: `internal_only` is produced by a delayed expected-missing sweep, not by report ingestion

The initial report ingestion flow should only classify facts present in the provider report. `internal_only` should be created by a separate scheduled reconciliation sweep that looks back at payout attempts expected to appear in closed report windows and confirms they still have no matching provider report line.

Why:

- missing-provider cases are an inference, not a direct fact from the payload
- report ingest time is too early to distinguish a real missing record from a provider cut-off or delayed reporting case
- a delayed sweep reduces false positives and better matches how operations teams reason about expected-but-missing activity

Alternatives considered:

- Create `internal_only` during report ingestion: rejected because it would create noisy exceptions whenever reports are partial, delayed, or still within their reporting cut-off window.

### Decision: Reconciliation should be compare-and-classify first, not auto-correct

This slice should not automatically post compensating entries from report mismatches. It should create or resolve reconciliation exceptions and surface enough linked data for an operator or later workflow to decide the next action.

Why:

- provider reports can expose timing differences that are not errors
- automatic correction without human review could create new financial mistakes
- it keeps the first reconciliation slice safer and easier to reason about

Alternatives considered:

- auto-correct all provider truth immediately: rejected because this is too risky for the first reconciliation implementation.

### Decision: Define scenario-level reconciliation handling up front

The following scenarios should be first-class in the design:

1. **Exact payout match**
   - Provider line matches payout attempt identifiers, currency, gross, fee, net, and terminal status.
   - Reconcile as `matched`.

2. **Duplicate provider delivery**
   - Same report batch id or same report line external identifier is replayed.
   - Deduplicate and do not create duplicate report lines or exceptions.

3. **Provider-only payout line**
   - Provider reports a payout line, but the platform cannot find a matching payout attempt or payout.
   - Reconcile as `provider_only`.
   - Create a high-severity exception for investigation.

4. **Internal payout missing from report**
   - Platform has an eligible payout attempt for the report window, but no corresponding provider line appears.
   - Do not create this during initial report ingestion.
   - A separate scheduled expected-missing sweep should create `internal_only` only after the relevant report window is closed and the payout is still unmatched.
   - If the payout is still plausibly within provider cut-off timing, keep it out of `internal_only` and treat it as a timing candidate instead.

5. **Amount mismatch**
   - Provider line matches a payout attempt, but gross, fee, or net differs from the internal record.
   - Reconcile as `amount_mismatch`.
   - Keep exception open until resolved manually or by later platform logic.

6. **Status mismatch**
   - Provider reports `paid`, `failed`, or `returned`, but internal payout state differs materially.
   - Reconcile as `status_mismatch`.
   - Link payout, attempt, latest webhook, and ledger context into the exception.

7. **Ledger follow-up missing**
   - Provider line and payout attempt match, but the expected ledger follow-up is absent.
   - Example: provider says `paid`, but no settlement ledger is linked.
   - Reconcile as `status_mismatch` and open a ledger-linked exception.

8. **Unsupported report line type**
   - Provider sends a line type the platform does not yet model, such as a return or reserve line not in scope.
   - Reconcile as `unsupported_report_line`.
   - Store it, do not discard it.

These classifications should drive admin labeling, alerting, and later operator actions.

## Risks / Trade-offs

- [Risk] Provider report formats may evolve faster than our normalized schema. → Mitigation: preserve raw payloads and store unsupported line types instead of dropping them.
- [Risk] Fallback matching can produce false positives if identifiers are missing. → Mitigation: use identifier-first matching and downgrade uncertain fallback matches into exceptions instead of auto-matching aggressively.
- [Risk] Report-window timing differences may create noisy exceptions. → Mitigation: classify likely cut-off issues as `timing_difference` and keep severity lower than hard mismatches.
- [Risk] Internal retries can create multiple payout attempts for one payout. → Mitigation: make payout attempt the primary matching target and keep attempt history append-only.
- [Risk] Operations may assume reconciliation status mutates financial truth. → Mitigation: keep this slice compare-and-classify only, with explicit notes that reconciliation does not auto-correct balances.

## Migration Plan

1. Add PSP sandbox reconciliation report simulation and webhook contract.
2. Add API-side report batch and report-line storage plus report webhook ingestion.
3. Add reconciliation matching service for payout-attempt, payout, webhook, and ledger linkage.
4. Add reconciliation outcomes and exception creation logic for report-present lines.
5. Add a scheduled expected-missing sweep that creates `internal_only` exceptions only after report windows have closed.
6. Add admin read APIs and admin UI surfaces for report batches, line outcomes, and unresolved exceptions.
7. Validate that duplicate report deliveries and repeat reconciliation runs remain idempotent.

Rollback strategy:

- disable report webhook ingestion while preserving stored payout and callback flows
- keep stored batches and lines append-only so reconciliation processing can be retried after a code rollback

## Open Questions

- Should the first report model cover only payout lines, or should the sandbox also include funding lines in the same batch format later?
- Do we want a distinct `returned` payout-report outcome in this slice, or should it be stored as `unsupported_report_line` until the return flow exists?
- Should reconciliation reports resolve previously open exceptions automatically when a later report or callback closes the gap, or should the first slice leave exception closure manual?
