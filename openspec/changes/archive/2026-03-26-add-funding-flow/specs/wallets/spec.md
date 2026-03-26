## ADDED Requirements

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
