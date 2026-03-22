## ADDED Requirements

### Requirement: User-facing transactions are stored separately from ledger postings
The system SHALL store customer-visible transaction history in `user_transactions` separately from internal ledger transactions and ledger entries.

#### Scenario: Payout creates one user-visible row
- **WHEN** a payout with internal fee and settlement postings is recorded
- **THEN** the schema supports one `user_transactions` record for the customer view without exposing the internal accounting lines directly

### Requirement: User transactions capture gross, fee, and net amounts
The system SHALL allow a user-facing transaction to store gross amount, fee amount, and net amount in minor units with explicit currency.

#### Scenario: User views payout with fee split
- **WHEN** a payout deducts a fee before net settlement
- **THEN** the user transaction can represent the gross payout amount, the fee amount, and the net amount in one record

### Requirement: User transactions support statement generation
The system SHALL provide the fields needed for downloadable user statements to be generated from `user_transactions`.

#### Scenario: Statement is generated from user history
- **WHEN** the platform generates a statement for a user wallet over a date range
- **THEN** the statement can be derived from `user_transactions` using transaction timestamps, descriptions, statuses, and monetary fields
