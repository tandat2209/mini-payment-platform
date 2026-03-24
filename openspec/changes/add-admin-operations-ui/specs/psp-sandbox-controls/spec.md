## ADDED Requirements

### Requirement: PSP sandbox funding trigger invokes the PSP sandbox service

The system SHALL expose a PSP sandbox HTTP surface that accepts structured funding inputs and invokes the PSP sandbox service to execute the corresponding funding event.

#### Scenario: Admin trigger request is accepted

- **WHEN** a PSP sandbox funding trigger request includes valid funding inputs
- **THEN** the PSP sandbox service executes the delivery and returns the delivery result to the caller

### Requirement: PSP sandbox trigger uses the provider-style funding contract

The PSP sandbox trigger SHALL support the same funding fields used by the funding simulation API, including `amountMinor`, `currency`, `destinationType`, `destinationIdentifier`, and optional remittance fields.

#### Scenario: Admin submits a provider-style funding payload

- **WHEN** an operator submits destination and remittance details from the admin UI
- **THEN** the PSP sandbox trigger uses the same provider-style funding contract

### Requirement: PSP sandbox trigger surfaces delivery failures clearly

The system SHALL return a clear error outcome when the PSP sandbox invocation fails or the downstream delivery cannot be completed.

#### Scenario: Simulator delivery fails

- **WHEN** the PSP sandbox trigger cannot obtain a successful result from the sandbox service
- **THEN** the API returns a failure response that the admin UI can render as an actionable error state
