## ADDED Requirements

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
