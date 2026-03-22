## ADDED Requirements

### Requirement: Wallet lifecycle supports one active wallet per user
The system SHALL allow a user to have multiple wallets over time while enforcing that at most one wallet is active at any given time.

#### Scenario: User opens a replacement wallet
- **WHEN** a previously active wallet is closed and a new wallet is created for the same user
- **THEN** the schema allows both wallet records to exist while enforcing that only the new wallet is marked active

### Requirement: Wallet balances are stored per currency
The system SHALL store wallet balances as one row per wallet and currency so a wallet can hold multiple currencies without mixing balance values across currencies.

#### Scenario: Wallet holds multiple currencies
- **WHEN** a wallet has USD and EUR funds
- **THEN** the schema stores separate balance records for USD and EUR for that wallet

### Requirement: Wallet funding details may vary by wallet
The system SHALL allow a wallet to have one or more funding detail records so inbound funding instructions can differ by rail, currency, or lifecycle over time.

#### Scenario: Wallet has multiple funding details
- **WHEN** a wallet supports more than one funding method
- **THEN** the schema can associate multiple funding detail records with the wallet without duplicating the wallet itself
