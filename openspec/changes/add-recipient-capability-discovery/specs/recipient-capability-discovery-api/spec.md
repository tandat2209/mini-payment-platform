## ADDED Requirements

### Requirement: Customer can discover available recipient onboarding combinations

The system SHALL expose a customer-facing recipient capability discovery API that returns the currently supported onboarding combinations by country, payout rail, and currency.

#### Scenario: Customer loads onboarding capability matrix

- **WHEN** the customer opens recipient onboarding
- **THEN** the system returns the currently available countries, rails, and currencies that can be used for recipient creation

### Requirement: Capability discovery is backend-owned

The system SHALL determine recipient onboarding availability from backend configuration and SHALL NOT require clients to hardcode supported country, rail, or currency combinations.

#### Scenario: Unsupported rail-country combination is not advertised

- **WHEN** a rail-country-currency combination is not currently supported by platform configuration
- **THEN** the capability discovery API omits that combination from the customer-visible response

### Requirement: Capability discovery includes onboarding strategy metadata

The system SHALL include enough metadata in the discovery response for clients to understand whether a supported recipient rail is platform-managed or provider-managed.

#### Scenario: Customer inspects a provider-managed rail option

- **WHEN** the capability discovery API returns a supported rail option that requires provider registration
- **THEN** the response includes metadata indicating that the rail requires provider-managed onboarding before payout readiness
