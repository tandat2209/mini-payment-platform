## MODIFIED Requirements

### Requirement: Customer can browse recipients

The system SHALL allow the current customer to retrieve saved recipients that belong to that customer. Each recipient item SHALL include the recipient identifier, display name, recipient status, created timestamp, and customer-safe rail summaries for active or pending rails, including rail readiness state.

#### Scenario: Customer retrieves recipient list

- **WHEN** the current customer requests the recipient list
- **THEN** the system returns only recipients owned by that customer

### Requirement: Customer can view recipient detail

The system SHALL allow the current customer to retrieve a saved recipient by identifier. The detail response SHALL include the recipient's active or pending rails, default-rail indicator, customer-safe rail detail fields needed for display, and each rail's onboarding or payout-readiness status.

#### Scenario: Customer retrieves recipient detail

- **WHEN** the current customer requests a recipient that belongs to that customer
- **THEN** the system returns the recipient and its active or pending rail details
