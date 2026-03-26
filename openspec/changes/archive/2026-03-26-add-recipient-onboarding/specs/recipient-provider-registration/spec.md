## ADDED Requirements

### Requirement: Recipient rails can track provider registration strategy

The system SHALL store a provider registration strategy for each recipient rail so the platform can distinguish between rails that require provider-side beneficiary registration and rails whose details can be embedded at payout submission time.

#### Scenario: Recipient rail is marked provider managed

- **WHEN** a recipient rail is configured for a provider and rail combination that requires beneficiary pre-registration
- **THEN** the recipient rail stores a strategy indicating that provider-side registration is required before payout

### Requirement: Provider-managed recipient rails store provider references and status

The system SHALL store provider-side beneficiary references, registration status, and error outcomes for recipient rails that are registered with a PSP before payout.

#### Scenario: Provider registration succeeds

- **WHEN** the platform successfully registers a recipient rail with the provider
- **THEN** the recipient rail stores the provider recipient reference and transitions to an active payout-ready state

### Requirement: Recipient rails can remain inactive after failed provider registration

The system SHALL preserve failed provider registration outcomes on the recipient rail and SHALL NOT mark the rail as payout-ready until the provider registration succeeds.

#### Scenario: Provider rejects beneficiary details

- **WHEN** the provider registration request returns a validation failure
- **THEN** the system stores the failure outcome on the recipient rail and keeps the rail unavailable for payout
