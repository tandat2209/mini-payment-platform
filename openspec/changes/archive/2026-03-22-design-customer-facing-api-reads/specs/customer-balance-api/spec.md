## ADDED Requirements

### Requirement: Customer can view active wallet balances

The system SHALL allow the current customer to retrieve their active wallet balance summary. The response SHALL include the active wallet identifier, wallet status, and one balance item per currency with `available`, `pending`, and `updatedAt` values expressed in minor units with explicit currency codes.

#### Scenario: Customer retrieves active wallet balances

- **WHEN** the current customer requests their balance summary and has an active wallet
- **THEN** the system returns the active wallet and all balance rows for that wallet

#### Scenario: Customer has no active wallet

- **WHEN** the current customer requests their balance summary and does not have an active wallet
- **THEN** the system returns a not-found response for the balance resource

### Requirement: Balance queries are customer scoped

The system SHALL scope balance retrieval to the current customer context and SHALL NOT return wallet or balance data that belongs to any other customer.

#### Scenario: Customer attempts to access another customer's balances

- **WHEN** a balance request is evaluated for the current customer context
- **THEN** only the active wallet owned by that customer is eligible to be returned
