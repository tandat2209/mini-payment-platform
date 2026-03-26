## ADDED Requirements

### Requirement: Outbound payout submissions are recorded as provider operations

The system SHALL submit booked payouts to the provider through a tracked outbound operation that records the provider, request identifiers, request payload, and initial provider response before the payout is considered submitted.

#### Scenario: Booked payout is submitted to provider

- **WHEN** the platform submits a booked payout to the PSP sandbox
- **THEN** it records the resulting provider operation in `payout_attempts` and links it to the payout

### Requirement: Provider payout status callbacks can be ingested

The system SHALL accept provider payout status callbacks, persist the raw callback payload, and map the callback onto the matching payout attempt and payout business record.

#### Scenario: Provider callback marks payout as paid

- **WHEN** the provider sends a payout callback for a known provider payout identifier with a paid outcome
- **THEN** the system records the callback and transitions the matching payout attempt and payout to paid

### Requirement: Duplicate payout callbacks do not duplicate financial side effects

The system SHALL deduplicate replayed payout callbacks and SHALL NOT create duplicate settlement or failure side effects for the same provider payout event.

#### Scenario: Provider replays the same paid callback

- **WHEN** the same provider payout event is delivered more than once
- **THEN** the system records at most one set of payout lifecycle and financial side effects for that event
