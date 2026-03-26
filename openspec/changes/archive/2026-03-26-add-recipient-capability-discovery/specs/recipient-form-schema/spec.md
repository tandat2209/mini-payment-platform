## ADDED Requirements

### Requirement: Recipient onboarding exposes a normalized field schema

The system SHALL expose a normalized recipient onboarding field schema for a selected country, rail, and currency combination so clients can render the onboarding form dynamically.

#### Scenario: Customer selects a supported rail combination

- **WHEN** the customer selects a supported country, rail, and currency combination
- **THEN** the system returns field metadata sufficient to render the corresponding recipient onboarding form

### Requirement: Field schema includes validation and rendering hints

The system SHALL include field-level metadata such as key, label, input kind, required status, and validation hints in the recipient onboarding schema response.

#### Scenario: Client renders a SWIFT onboarding form

- **WHEN** the schema response includes SWIFT-specific fields
- **THEN** the response identifies each field's input kind and whether it is required so the client can render and label the form correctly

### Requirement: Schema contract supports future dynamic dependencies

The system SHALL allow recipient onboarding schema responses to express dependency metadata for future cases where one field changes the allowed values or shape of later fields.

#### Scenario: Client receives a schema with dependent options

- **WHEN** the recipient onboarding schema includes metadata that one field affects another field's available options
- **THEN** the response identifies that dependency so the client can refresh or recompute the downstream field state
