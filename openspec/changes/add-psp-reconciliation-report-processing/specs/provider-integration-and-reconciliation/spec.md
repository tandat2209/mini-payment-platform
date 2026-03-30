## MODIFIED Requirements

### Requirement: Reconciliation uses operational and ledger records

The system SHALL support reconciliation of provider reconciliation reports against payout attempts, payouts, provider beneficiary references, webhook events, user transactions, and ledger records instead of relying only on user-visible transaction history. Reconciliation SHALL classify provider-present report lines during ingestion, and it SHALL detect expected-but-missing internal records through a separate delayed sweep after the relevant report windows have closed.

#### Scenario: PSP report line matches internal payout records

- **WHEN** the platform compares a provider reconciliation report line against internal payout attempts, payouts, webhook history, and ledger linkage and finds a complete match
- **THEN** the system records that report line as reconciled without creating an exception

#### Scenario: PSP report line exposes a mismatch

- **WHEN** the platform compares a provider reconciliation report line against internal records and finds a status mismatch, amount mismatch, or provider-only record
- **THEN** the system records the mismatch classification and opens a reconciliation exception with the linked operational and ledger context

#### Scenario: Eligible payout is still missing from provider reports after cut-off

- **WHEN** a payout attempt is old enough that it should have appeared in a closed provider report window and still has no matched report line
- **THEN** the system creates an `internal_only` reconciliation result from the delayed expected-missing sweep rather than from report-line ingestion
