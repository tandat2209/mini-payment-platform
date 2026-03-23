## ADDED Requirements

### Requirement: Admin simulator trigger endpoint invokes the simulator service

The system SHALL expose an admin-facing API that accepts structured funding simulation inputs and invokes the simulator service to execute the corresponding funding event.

#### Scenario: Admin trigger request is accepted

- **WHEN** an admin-facing simulator trigger request includes valid funding inputs
- **THEN** the API calls the simulator service and returns the simulator delivery result to the caller

### Requirement: Admin simulator trigger uses the provider-style funding contract

The admin simulator trigger SHALL support the same funding fields used by the simulator funding API, including `amountMinor`, `currency`, `destinationType`, `destinationIdentifier`, and optional remittance fields.

#### Scenario: Admin submits a provider-style funding payload

- **WHEN** an operator submits destination and remittance details from the admin UI
- **THEN** the admin trigger endpoint forwards a simulator request using the same provider-style funding contract

### Requirement: Admin simulator trigger surfaces delivery failures clearly

The system SHALL return a clear error outcome when the simulator invocation fails or the downstream delivery cannot be completed.

#### Scenario: Simulator delivery fails

- **WHEN** the admin trigger endpoint cannot obtain a successful result from the simulator service
- **THEN** the API returns a failure response that the admin UI can render as an actionable error state
