## ADDED Requirements

### Requirement: Paid payouts create a settlement ledger posting

The system SHALL create one balanced settlement ledger posting when a payout reaches a paid terminal state, clearing the recipient payable and reducing platform cash in the payout currency.

#### Scenario: Payout settles successfully

- **WHEN** a payout transitions to paid after provider confirmation
- **THEN** the system posts one balanced ledger transaction that debits recipient payables and credits platform cash

### Requirement: Failed payouts create a compensating ledger reversal

The system SHALL create one balanced compensating ledger posting when a booked payout transitions to failed before settlement, reversing the booked recipient payable back into wallet liability.

#### Scenario: Submitted payout later fails

- **WHEN** a payout transitions from an in-flight state to failed
- **THEN** the system posts one balanced ledger transaction that debits recipient payables and credits wallet liabilities
