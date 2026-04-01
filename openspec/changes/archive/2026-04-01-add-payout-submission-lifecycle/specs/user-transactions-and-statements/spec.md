## ADDED Requirements

### Requirement: Customer-visible payout transactions reflect provider lifecycle state

The system SHALL update customer-visible payout transactions as provider submission and terminal outcomes are received so payout history reflects whether a payout is submitted, processing, paid, or failed.

#### Scenario: Provider accepts payout for processing

- **WHEN** a booked payout is accepted by the provider
- **THEN** the linked customer-visible payout transaction reflects an in-flight payout state

### Requirement: Failed payout outcomes restore customer-visible net position

The system SHALL reverse the customer-visible effect of a booked payout when the payout later fails before settlement, including restoring the available wallet balance and reflecting the failed terminal state in payout history.

#### Scenario: Provider reports payout failure after booking

- **WHEN** a previously booked payout later fails
- **THEN** the linked customer-visible payout transaction reflects failure and the customer's available wallet funds are restored
