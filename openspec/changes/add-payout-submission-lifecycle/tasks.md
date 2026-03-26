## 1. PSP Sandbox Payout Contracts

- [x] 1.1 Add PSP sandbox payout submission and payout update contracts, including deterministic success or failure controls for local testing.
- [x] 1.2 Add PSP sandbox persistence for submitted payouts and payout activity events so later report simulation can be generated from sandbox-owned records.
- [x] 1.3 Implement PSP sandbox endpoints for payout submission and payout status callback delivery.
- [x] 1.4 Add automated coverage for accepted payout submissions, persisted sandbox activity, and delayed payout outcome simulation.

## 2. API Payout Submission And Attempt Tracking

- [ ] 2.1 Add API-side payout submission gateway contracts and SQL repository support for creating and updating `payout_attempts`.
- [ ] 2.2 Update payout execution so booked payouts are submitted to the PSP sandbox after internal booking and transition to provider-facing in-flight states.
- [ ] 2.3 Add automated coverage for payout submission success, idempotent retry behavior, and attempt persistence.

## 3. Provider Callback Handling And Financial Outcomes

- [ ] 3.1 Add payout provider callback ingestion and mapping from provider identifiers to payout attempts and payouts.
- [ ] 3.2 Implement paid-payout settlement handling, including payout state changes, customer transaction updates, and settlement ledger posting.
- [ ] 3.3 Implement failed-payout reversal handling, including wallet restoration, customer transaction failure state, and compensating ledger posting.
- [ ] 3.4 Add automated coverage for paid and failed callback paths, including duplicate callback replay.

## 4. Customer Flow And Verification

- [ ] 4.1 Update the customer payout experience to surface submitted, processing, paid, and failed lifecycle states instead of stopping at booking only.
- [ ] 4.2 Verify locally that one payout can be booked, submitted to the PSP sandbox, and completed successfully with matching payout, transaction, attempt, and ledger records.
- [ ] 4.3 Verify locally that one payout can be booked, submitted, and failed with restored wallet balance and compensating records.
- [ ] 4.4 Document the local payout submission workflow across web, API, and PSP sandbox.
