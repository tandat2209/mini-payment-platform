## Why

The platform can now process inbound funding, submit payouts, ingest payout status callbacks, and handle post-settlement payout returns, but it still has no provider-originated end-of-day reconciliation path. We need the next slice so a PSP sandbox can deliver daily reconciliation reports by webhook, the platform can store those reports durably, and operations can compare provider truth against funding events, payout attempts, returned payouts, ledger state, and wallet obligations instead of relying on ad hoc investigation.

## What Changes

- Add PSP reconciliation report webhook ingestion so the API can accept daily provider reconciliation deliveries, store the raw report, and deduplicate repeated deliveries safely.
- Add durable report storage for reconciliation batches and report lines, including provider batch identifiers, report dates, raw payloads, normalized provider line types, parsed line items, and processing status.
- Add reconciliation matching logic that compares each provider report line to internal funding events, payout attempts, returned payouts, wallet movements, ledger postings, and webhook history.
- Add explicit reconciliation outcomes and exception categories so the system can distinguish matched, mismatched, duplicate, extra, and timing-difference cases during report processing, plus delayed `internal_only` detection through a separate expected-missing sweep.
- Add admin read models for reconciliation report history, report-line outcomes, and unresolved exceptions so operations can investigate and work the queue without database inspection.
- Define scenario-level reconciliation rules for common funding, payout, and returned-payout report outcomes, including what should auto-match, what should remain open, and what should require compensating or manual follow-up.

## Capabilities

### New Capabilities

- `psp-reconciliation-report-webhooks`: Ingest, store, deduplicate, and process provider reconciliation report webhooks and their report lines.

### Modified Capabilities

- `provider-integration-and-reconciliation`: Provider integrations now include daily reconciliation report ingestion, line matching, and exception classification beyond raw payout or funding webhooks alone.
- `admin-operations-read-api`: Admin read models now expose reconciliation report batches, report-line outcomes, and unresolved report-driven exceptions for operations review.

## Impact

- Affected code:
  - `apps/api/src/operations`
  - `apps/api/src/payouts`
  - `apps/api/src/ledger`
  - `apps/api/src/transactions`
  - `apps/psp-sandbox`
  - `apps/web/src/features/admin`
  - `packages/db`
- APIs:
  - new PSP reconciliation report webhook endpoint(s)
  - new admin reconciliation report read endpoint(s)
- Data:
  - reconciliation report batches
  - reconciliation report lines
  - report-line outcomes and exception records
- Systems:
  - PSP sandbox report simulation
  - provider webhook ingestion
  - funding event matching
  - payout attempt and return matching
  - operational reconciliation workflow
