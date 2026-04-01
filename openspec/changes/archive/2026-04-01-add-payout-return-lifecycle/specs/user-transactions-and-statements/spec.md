## MODIFIED Requirements

### Requirement: Customer-visible payout transactions reflect provider lifecycle state

The system SHALL update customer-visible payout transactions as provider submission and terminal outcomes are received so payout history reflects whether a payout is submitted, processing, paid, failed, or returned. When a payout is returned after settlement, the original payout debit SHALL remain in history and move to a `returned` final status rather than being rewritten into an inbound funding event.

#### Scenario: Provider later returns a paid payout

- **WHEN** a payout that was previously shown as paid later receives a provider return event
- **THEN** the linked customer-visible payout transaction reflects a returned terminal state instead of remaining paid or being rewritten as failed

### Requirement: Failed payout outcomes restore customer-visible net position

The system SHALL reverse the customer-visible effect of a booked payout when the payout later fails before settlement, including restoring the available wallet balance and reflecting the failed terminal state in payout history. The system SHALL treat returned payouts separately from failed payouts because returned payouts occur after settlement.

#### Scenario: Provider reports payout failure after booking

- **WHEN** a previously booked payout later fails before settlement
- **THEN** the linked customer-visible payout transaction reflects failure and the customer's available wallet funds are restored

#### Scenario: Provider reports payout return after settlement

- **WHEN** a previously paid payout later returns
- **THEN** the linked customer-visible payout transaction reflects a returned outcome and the wallet restoration follows the return policy rather than the failed-payout path

### Requirement: Returned payouts create a separate customer-visible return credit

The system SHALL create a separate customer-visible credit transaction for the actual amount returned to the wallet after a post-settlement payout return. That credit transaction SHALL be linked to the original payout so customers can reconcile wallet balance changes directly from transaction history.

#### Scenario: Full payout return is credited back to wallet

- **WHEN** a previously paid payout later returns in full
- **THEN** the system records a separate return credit transaction for the full returned amount and links it to the original payout debit

#### Scenario: Partial payout return is credited back to wallet

- **WHEN** a previously paid payout later returns for less than the original gross amount
- **THEN** the system records a separate return credit transaction for the actual returned amount and leaves the original payout debit visible with a `returned` final status

### Requirement: Returned payouts reverse fee revenue in the first slice

The system SHALL reverse fee revenue in full for returned payouts in the first slice, even when the actual returned wallet amount is less than the original gross amount.

#### Scenario: Returned payout reverses fee revenue

- **WHEN** a previously paid payout later returns
- **THEN** the system reverses the payout fee revenue in full as part of the returned-payout handling
