## Context

The platform already supports these payout lifecycle stages:

- booking
- provider submission
- processing
- paid
- failed

`failed` currently means the payout did not complete before settlement and can therefore be reversed back to wallet liability and available balance as a pre-settlement failure.

A returned payout is different. In that case:

- the payout was already marked `paid`
- settlement ledger was already posted
- later, the provider or destination bank returns the funds

That means the platform must handle a post-settlement reversal, not a simple pre-settlement failure. It also cannot assume the customer always receives the full original gross amount back, because some returns are partial or happen after fee deduction. This change crosses payout lifecycle, provider event ingestion, customer transaction semantics, ledger behavior, and admin investigation, so a design document is useful.

## Goals / Non-Goals

**Goals:**

- Model `returned` as a distinct payout lifecycle outcome after `paid`.
- Support PSP sandbox simulation of payout return events.
- Ingest provider payout return events and link them to payout attempts and payouts.
- Add explicit ledger behavior for post-settlement returned payouts.
- Support actual returned amounts that may differ from the original payout gross amount.
- Reflect returned payouts in customer-visible payout history and admin operations reads.
- Keep return handling auditable and append-only.

**Non-Goals:**

- Full dispute or chargeback workflows beyond payout returns.
- Automatic treasury sweeps or revenue close adjustments outside the payout return path.
- Reconciliation report ingestion itself.
- Multi-provider return normalization beyond the PSP sandbox contract.
- Complex manual operations tooling for returned-payout remediation.

## Decisions

### Decision: `returned` is a distinct payout terminal state, not an alias for `failed`

The payout lifecycle should explicitly support `returned` for a payout that was previously `paid` and later reversed by the provider.

Why:

- `failed` is pre-settlement and `returned` is post-settlement
- they imply different ledger history and different operational meaning
- customer and admin views should preserve that distinction

Alternatives considered:

- Reuse `failed` for both cases: rejected because it collapses two materially different financial paths into one ambiguous status.

### Decision: Returned payouts are linked to the original paid payout and attempt history

A payout return should attach to the previously settled payout and the provider attempt lineage that produced it, rather than being modeled as a brand-new inbound funding event.

Why:

- preserves auditability from original payout through settlement through return
- keeps provider and admin investigation tied to the original money movement
- avoids misclassifying returned funds as unrelated customer funding

Alternatives considered:

- Model return as normal funding: rejected because it breaks the relationship to the original payout and hides the reason funds came back.

### Decision: Post-settlement return accounting is append-only and separate from pre-settlement failure reversal

The system should add new ledger entries for the return flow instead of mutating prior settlement history or reusing the pre-settlement failed-payout reversal.

Expected accounting shape for a returned payout:

- reverse the prior settlement effect on platform cash by the actual amount returned from the provider
- restore customer wallet liability and customer spendable position by the actual amount credited back to the wallet
- reverse fee revenue in full for the first slice, even when the returned amount is less than the original gross amount

Why:

- preserves append-only ledger history
- keeps the difference between `paid`, `returned`, and `failed` understandable
- gives reconciliation and finance a truthful sequence of events

Alternatives considered:

- mutate the existing settlement record: rejected because financial history must remain append-only.
- reuse the failed-payout reversal exactly: rejected because settlement already happened.

### Decision: Customer history should show a returned payout as two linked wallet movements

The original payout debit should remain in customer history and move to a final `returned` status. The actual money coming back should be recorded as a separate credit transaction linked to the original payout.

Why:

- customers can reconcile their wallet balance directly from the feed
- partial returns become visible without rewriting the original debit
- the system preserves both the outbound payout and the later compensating inbound return

Alternatives considered:

- rewrite the original payout transaction amount in place: rejected because it hides the actual wallet movement history
- show only one payout row with no return credit: rejected because the balance would be harder for customers to understand, especially for partial returns

### Decision: Return events should default to restoring customer available balance in this slice

For the first return-lifecycle slice, the actual returned amount should go back to customer available balance unless the platform later introduces a separate review or hold account for returned payouts.

Why:

- simplest customer-facing behavior
- consistent with the product expectation that returned funds come back to the wallet
- avoids introducing a new hold-balance concept before it is needed

Alternatives considered:

- restore funds to a pending-review balance: rejected for now because it adds a new balance state and admin workflow not otherwise required in this slice.

### Decision: Reuse existing provider event storage and payout linkage instead of adding a dedicated payout-return table

The first return-lifecycle slice should use the existing provider event storage and payout linkage model rather than introducing a dedicated payout-return table.

Why:

- keeps the return slice smaller and easier to implement
- return events are still provider-originated events attached to a known payout lineage
- avoids adding a new persistence concept before we know it is necessary

Alternatives considered:

- add a dedicated payout-return table immediately: rejected because the first slice can be modeled cleanly with provider events plus payout linkage

### Decision: PSP sandbox should emit explicit payout return events for previously paid payouts

The PSP sandbox should expose a deterministic way to trigger a return event for a payout already marked `paid`.

Why:

- return behavior must be testable separately from `failed`
- it lets us validate the post-settlement reversal path locally before reconciliation work

Alternatives considered:

- defer sandbox support until later: rejected because the return flow would be hard to verify end-to-end.

## Risks / Trade-offs

- [Risk] Fee treatment on returned payouts may depend on real provider or business rules, and some returns may be partial. → Mitigation: store actual returned amounts explicitly and reverse fee revenue fully in the first slice until more specific rail rules are introduced.
- [Risk] Returning funds directly to available balance may later prove too permissive for some rails. → Mitigation: keep the first slice simple but isolate the restoration step so a later hold-policy change is possible.
- [Risk] Provider return events may arrive long after the payout was marked paid. → Mitigation: keep payout return handling idempotent and append-only, linked to original attempt and payout records.
- [Risk] Returned payouts may later interact with reconciliation and report ingestion rules. → Mitigation: add return lifecycle first so reconciliation can consume a defined internal model instead of inventing one.

## Migration Plan

1. Add PSP sandbox payout return simulation contract.
2. Add payout return event ingestion and payout state transition handling in the API.
3. Add post-settlement return ledger postings, separate return credit transaction behavior, and wallet restoration behavior using the actual returned amount.
4. Update customer and admin read models to expose returned payouts distinctly, including the link between the original payout debit and the later return credit.
5. Verify returned payout flow end-to-end before layering reconciliation-report processing on top.

Rollback approach:

- disable return-event ingestion while preserving the existing submitted/processing/paid/failed paths
- keep stored return events append-only so they can be reprocessed after a rollback if needed

## Open Questions

- None for the first slice. Fee reversal, customer-facing status, and event storage approach are intentionally fixed to keep payout returns simpler than the later reconciliation slice.
