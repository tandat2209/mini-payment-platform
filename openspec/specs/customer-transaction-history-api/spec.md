# customer-transaction-history-api Specification

## Purpose

Define the customer-facing transaction history API for browsing paginated transaction history and viewing customer-safe transaction detail.

## Requirements

### Requirement: Customer can browse transaction history

The system SHALL allow the current customer to retrieve paginated transaction history from `user_transactions`. Each transaction item SHALL include the customer-visible transaction identifier, type, direction, status, currency, gross amount, fee amount, net amount, description, reference, occurred timestamp, and posted timestamp.

#### Scenario: Customer retrieves the first page of transactions

- **WHEN** the current customer requests transaction history without a cursor
- **THEN** the system returns the newest eligible transactions first

#### Scenario: Customer filters transaction history

- **WHEN** the current customer requests transaction history with supported filters such as currency, type, status, or date range
- **THEN** the system returns only transactions that match the supplied filters and belong to that customer

#### Scenario: Customer requests the next transaction page

- **WHEN** the current customer requests transaction history with a valid cursor
- **THEN** the system returns the next page in the same descending activity order

### Requirement: Customer can view transaction detail

The system SHALL allow the current customer to retrieve a single customer-visible transaction by identifier. When the transaction is linked to a payout, the response SHALL include customer-safe payout context such as recipient name and payout reference when that data exists.

#### Scenario: Customer retrieves payout transaction detail

- **WHEN** the current customer requests a transaction that is linked to a payout
- **THEN** the system returns the transaction fields together with the customer-safe payout context

### Requirement: Transaction queries are customer scoped

The system SHALL scope transaction history and transaction detail to the current customer context and SHALL NOT expose another customer's transaction records.

#### Scenario: Customer requests another customer's transaction

- **WHEN** the current customer requests a transaction identifier that is not owned by that customer
- **THEN** the system returns a not-found response for that transaction resource
