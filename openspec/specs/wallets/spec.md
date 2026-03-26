# wallets Specification

## Purpose

Define the schema requirements for wallet lifecycle, per-currency balances, and wallet funding detail records.

## Requirements

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

### Requirement: Successful funding processing increases the targeted wallet balance

The system SHALL increase the available balance of the active wallet for the funded currency when a funding webhook is processed successfully. If the wallet does not yet have a balance row for that currency, the system SHALL create one during funding processing.

#### Scenario: Funding credits an existing wallet balance row

- **WHEN** a valid funding webhook is processed for a currency that already has a balance row on the active wallet
- **THEN** the system increases that wallet balance row by the funded amount

#### Scenario: Funding credits a currency without an existing balance row

- **WHEN** a valid funding webhook is processed for a currency that does not yet have a balance row on the active wallet
- **THEN** the system creates the missing wallet balance row and initializes it with the funded amount

### Requirement: Funding applies only to the owning active wallet

The system SHALL apply inbound funding only to the active wallet that owns the referenced active funding detail and SHALL reject funding for inactive or mismatched wallet ownership.

#### Scenario: Funding detail belongs to a closed or mismatched wallet

- **WHEN** a funding webhook references a funding detail that does not belong to the customer's active wallet
- **THEN** the system does not mutate any wallet balance for that event
