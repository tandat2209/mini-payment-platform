## ADDED Requirements

### Requirement: Raw provider webhooks are stored and deduplicated
The system SHALL store raw PSP webhook events with provider identifiers, external event references, payloads, and processing status so duplicate deliveries can be detected safely.

#### Scenario: Duplicate webhook is received
- **WHEN** the PSP delivers the same webhook event more than once
- **THEN** the schema can identify the duplicate using the provider and external event reference without creating duplicate internal financial records

### Requirement: Outbound financial operations support idempotency
The system SHALL store idempotency records for externally submitted financial operations so retries do not create duplicate provider-side requests.

#### Scenario: Payout submission is retried
- **WHEN** the platform retries a payout submission after a timeout or uncertain response
- **THEN** the schema can reuse the idempotency key record associated with that operation

### Requirement: Inbound funding can be recognized from provider events
The system SHALL support linking inbound provider webhook processing to wallet balance changes, user transactions, and ledger postings without requiring duplicate external state tables in the initial design.

#### Scenario: PSP webhook credits wallet
- **WHEN** a PSP webhook confirms inbound money for a user
- **THEN** the schema can store the webhook record and link the resulting wallet, user transaction, and ledger records to that provider event

### Requirement: Reconciliation uses operational and ledger records
The system SHALL support reconciliation of provider reports against payout attempts, webhook events, and ledger records instead of relying only on user-visible transaction history.

#### Scenario: PSP report is reconciled
- **WHEN** the platform compares a provider statement or report against internal records
- **THEN** the schema provides provider references and ledger linkage needed to reconcile operational outcomes and booked financial movements
