## MODIFIED Requirements

### Requirement: Raw provider webhooks are stored and deduplicated

The system SHALL store raw PSP webhook events with provider identifiers, external event references, payloads, and processing status so duplicate deliveries can be detected safely. This SHALL include payout return events in addition to funding and payout-status callbacks.

#### Scenario: Duplicate payout return event is received

- **WHEN** the PSP delivers the same payout return event more than once
- **THEN** the system detects the duplicate using the provider and external event reference without creating duplicate internal financial records

### Requirement: Reconciliation uses operational and ledger records

The system SHALL support reconciliation of provider reports against payout attempts, provider beneficiary references, webhook events, payout return events, and ledger records instead of relying only on user-visible transaction history.

#### Scenario: Provider report references returned payout

- **WHEN** the platform compares a provider statement or report against internal records for a payout that was previously paid and later returned
- **THEN** the schema provides provider return linkage and ledger linkage needed to reconcile that post-settlement reversal
