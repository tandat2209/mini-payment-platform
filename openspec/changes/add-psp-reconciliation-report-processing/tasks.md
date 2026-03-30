## 1. PSP Sandbox Report Simulation And Contract

- [x] 1.1 Define the PSP sandbox reconciliation report webhook payload, including provider report identifiers, report date window, and normalized funding, payout, and return report line structure.
- [x] 1.2 Add PSP sandbox support for generating deterministic daily reconciliation reports and delivering them to the API webhook endpoint.
- [x] 1.3 Add automated coverage for report generation, webhook delivery, and duplicate report replay.

## 2. API Report Ingestion And Storage

- [x] 2.1 Add API-side reconciliation report webhook ingestion, deduplication, and raw payload persistence.
- [x] 2.2 Add durable storage for reconciliation report batches and normalized reconciliation report lines, including processing status and provider identifiers.
- [x] 2.3 Add automated coverage for accepted report ingestion, rejected invalid reports, and duplicate report deduplication.

## 3. Reconciliation Matching And Exception Classification

- [ ] 3.1 Implement reconciliation matching from report lines to funding events, payout attempts, returned payouts, webhook records, user transactions, and ledger records.
- [ ] 3.2 Implement explicit line-outcome classification for matched, timing-difference, provider-only, amount-mismatch, status-mismatch, duplicate-provider-line, and unsupported-line cases during report processing.
- [ ] 3.3 Create reconciliation exception records for non-auto-resolved cases and preserve linked operational context for investigation.
- [ ] 3.4 Add a scheduled expected-missing sweep that marks eligible unmatched payouts as `internal_only` only after report windows have closed.
- [ ] 3.5 Add automated coverage for the core reconciliation scenarios, delayed `internal_only` detection, and repeatable reconciliation runs.

## 4. Admin Read Models And Verification

- [ ] 4.1 Add admin read APIs for reconciliation report batches, report-line outcomes, and unresolved reconciliation exceptions.
- [ ] 4.2 Update the admin reconciliation workspace to surface report history, line-level outcomes, and linked investigation paths into payouts, webhooks, transactions, and ledger.
- [ ] 4.3 Verify locally that a simulated PSP reconciliation report can be delivered, stored, reconciled, and inspected through the admin app.
- [ ] 4.4 Document the local reconciliation-report workflow across PSP sandbox, API, and admin operations.
