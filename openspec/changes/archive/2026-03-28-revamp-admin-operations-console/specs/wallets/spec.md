## ADDED Requirements

### Requirement: Admin wallet registry supports multi-currency wallet inspection

The system SHALL support an admin wallet registry that shows wallet lifecycle and per-currency balances without flattening a wallet into a single-currency record.

#### Scenario: Admin views a wallet with multiple currencies

- **WHEN** an admin inspects a wallet that holds balances in more than one currency
- **THEN** the wallet is represented as one wallet record with multiple currency balance rows rather than duplicated wallet identities

### Requirement: Wallet domain supports treasury aggregation by currency

The system SHALL support aggregating wallet balance rows by currency for admin treasury monitoring without changing the underlying per-wallet, per-currency wallet balance model.

#### Scenario: Admin reviews platform exposure by currency

- **WHEN** the admin treasury workspace requests aggregate balance exposure
- **THEN** the system can compute per-currency totals from wallet balance rows while preserving wallet-level drilldown
