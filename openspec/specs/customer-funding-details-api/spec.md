# customer-funding-details-api Specification

## Purpose

Define the customer-facing API for retrieving active funding details tied to the active wallet.

## Requirements

### Requirement: Customer can retrieve active funding details for the active wallet

The system SHALL allow the current customer to retrieve funding instructions for their active wallet. The response SHALL include the active wallet identifier, wallet status, and every active funding detail for that wallet, including its identifier, rail, currency, details payload, and update timestamp.

#### Scenario: Customer retrieves active funding details

- **WHEN** the current customer requests funding details and has an active wallet with one or more active funding detail records
- **THEN** the system returns the active wallet and all active funding details associated with that wallet

#### Scenario: Customer has an active wallet with no active funding details

- **WHEN** the current customer requests funding details and the active wallet has no active funding detail records
- **THEN** the system returns the active wallet information with an empty funding details collection

#### Scenario: Customer has no active wallet

- **WHEN** the current customer requests funding details and does not have an active wallet
- **THEN** the system returns a not-found response for the funding details resource

### Requirement: Funding detail retrieval is customer scoped

The system SHALL scope funding detail retrieval to the current customer context and SHALL NOT return funding details that belong to any other customer's wallet.

#### Scenario: Customer attempts to access another customer's funding details

- **WHEN** a funding details request is evaluated for the current customer context
- **THEN** only active funding details owned by that customer's active wallet are eligible to be returned
