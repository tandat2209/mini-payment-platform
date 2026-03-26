# provider-integration-and-reconciliation Specification

## Purpose

Define the schema requirements for provider webhooks, idempotent outbound operations, inbound funding linkage, and reconciliation support.

## Requirements

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

### Requirement: Provider funding webhooks can be ingested

The system SHALL accept provider `funding.completed` webhook deliveries, persist the raw payload in `webhook_events`, and transition the webhook processing status to a terminal outcome after evaluation. The webhook payload SHALL support external destination targeting via `destinationType` and `destinationIdentifier`, plus optional remittance metadata such as `description`, `providerReference`, and `sender`.

#### Scenario: Funding webhook is accepted for processing

- **WHEN** a provider sends a valid `funding.completed` webhook for an active funding target
- **THEN** the system stores the webhook payload and marks the webhook record as processed after successful financial application

### Requirement: Funding webhook processing is idempotent per provider event

The system SHALL deduplicate funding webhook deliveries by provider and external event identifier and SHALL NOT create duplicate wallet, transaction, or ledger side effects for a replayed event.

#### Scenario: Duplicate funding webhook is replayed

- **WHEN** the same provider sends the same external event identifier more than once
- **THEN** the system records at most one set of financial side effects for that provider event

### Requirement: Invalid funding webhook targets are recorded without financial mutation

The system SHALL mark a funding webhook as failed or ignored when the destination details cannot be resolved to an active funding target, or when the resolved wallet and currency do not match an active funding instruction, and SHALL NOT mutate balances, transactions, or ledger state for that event.

#### Scenario: Funding webhook references an invalid target

- **WHEN** a `funding.completed` webhook references an inactive, missing, or mismatched funding target
- **THEN** the webhook is recorded with a non-processed terminal outcome and no financial records are created

### Requirement: Reconciliation uses operational and ledger records

The system SHALL support reconciliation of provider reports against payout attempts, provider beneficiary references, webhook events, and ledger records instead of relying only on user-visible transaction history.

#### Scenario: PSP report is reconciled

- **WHEN** the platform compares a provider statement or report against internal records
- **THEN** the schema provides provider references, beneficiary linkage, and ledger linkage needed to reconcile operational outcomes and booked financial movements

### Requirement: Outbound beneficiary registration is tracked as a provider operation

The system SHALL support storing provider-facing beneficiary registration attempts, provider references, and outcomes so recipient onboarding can be audited separately from payout submission.

#### Scenario: Beneficiary registration is retried

- **WHEN** the platform retries provider-side beneficiary registration after a timeout or uncertain response
- **THEN** the system preserves the provider registration attempt history without overwriting earlier outcomes
