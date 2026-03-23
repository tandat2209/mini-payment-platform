## ADDED Requirements

### Requirement: Admin can list user transactions across the platform

The system SHALL expose an admin-scoped transactions endpoint that lists user transactions across customers with pagination and filtering support.

#### Scenario: Admin requests platform transactions

- **WHEN** an operator calls the admin transactions endpoint
- **THEN** the system returns user transaction records across the platform rather than limiting results to one customer context

### Requirement: Admin can inspect transaction detail without customer scoping

The system SHALL expose an admin transaction detail endpoint that returns a selected user transaction and any associated operational context needed for inspection.

#### Scenario: Admin opens one transaction

- **WHEN** an operator requests a specific transaction from the admin area
- **THEN** the system returns the transaction detail even if it belongs to a different customer than the current demo customer context

### Requirement: Admin can list ledger transactions across the platform

The system SHALL expose an admin-scoped ledger endpoint that lists ledger transactions with filtering and ordering suitable for operational inspection.

#### Scenario: Admin requests ledger transactions

- **WHEN** an operator calls the admin ledger transactions endpoint
- **THEN** the system returns ledger transactions across the platform with their financial references and posting metadata

### Requirement: Admin can inspect ledger entries for a selected ledger transaction

The system SHALL expose an admin ledger detail endpoint that returns the entries associated with a selected ledger transaction.

#### Scenario: Admin opens ledger transaction detail

- **WHEN** an operator selects a ledger transaction from the admin area
- **THEN** the system returns the debit and credit entries linked to that ledger transaction
