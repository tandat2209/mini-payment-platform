## MODIFIED Requirements

### Requirement: Reconciliation uses operational and ledger records

The system SHALL support reconciliation of provider reports against payout attempts, provider beneficiary references, webhook events, and ledger records instead of relying only on user-visible transaction history.

#### Scenario: PSP report is reconciled

- **WHEN** the platform compares a provider statement or report against internal records
- **THEN** the schema provides provider references, beneficiary linkage, and ledger linkage needed to reconcile operational outcomes and booked financial movements

## ADDED Requirements

### Requirement: Outbound beneficiary registration is tracked as a provider operation

The system SHALL support storing provider-facing beneficiary registration attempts, provider references, and outcomes so recipient onboarding can be audited separately from payout submission.

#### Scenario: Beneficiary registration is retried

- **WHEN** the platform retries provider-side beneficiary registration after a timeout or uncertain response
- **THEN** the system preserves the provider registration attempt history without overwriting earlier outcomes
