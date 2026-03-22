## ADDED Requirements

### Requirement: Ledger uses append-only double-entry posting
The system SHALL store accounting truth in append-only ledger transactions and ledger entries using double-entry accounting.

#### Scenario: Ledger transaction posts debit and credit entries
- **WHEN** the platform records a funding or payout-related financial movement
- **THEN** the schema stores the movement as a ledger transaction with corresponding debit and credit entries rather than mutating prior entries

### Requirement: Ledger balances per currency
The system SHALL require ledger postings to balance within the same currency and SHALL store all monetary values in integer minor units with explicit currency codes.

#### Scenario: Multi-currency posting is recorded
- **WHEN** the platform records ledger entries for a USD transaction
- **THEN** the debit and credit totals balance within USD and the amounts are stored as integer minor units

### Requirement: Wallet balance updates are linked to ledger posting
The system SHALL support atomic updates where wallet balance changes and related ledger postings can be committed together.

#### Scenario: Funding credits a wallet
- **WHEN** inbound funding is recognized for a wallet
- **THEN** the schema supports recording the wallet balance change and the related ledger transaction within the same database transaction
