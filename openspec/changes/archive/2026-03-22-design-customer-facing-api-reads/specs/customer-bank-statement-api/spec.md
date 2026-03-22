## ADDED Requirements

### Requirement: Customer can view available statement periods

The system SHALL allow the current customer to retrieve the available monthly statement periods for their active wallet. Each statement period SHALL identify the wallet, currency, year, and month for a customer-viewable statement resource.

#### Scenario: Customer lists available statements

- **WHEN** the current customer requests available statement periods and has statement-eligible activity
- **THEN** the system returns the monthly statement periods that can be viewed for that customer's active wallet

### Requirement: Customer can view statement detail

The system SHALL allow the current customer to retrieve statement detail for a requested wallet, currency, year, and month that belongs to the current customer. A statement detail response SHALL include statement period metadata, opening balance, closing balance, total credits, total debits, and the customer-visible line items for that statement.

#### Scenario: Customer retrieves statement detail

- **WHEN** the current customer requests a statement period that exists for that customer's active wallet
- **THEN** the system returns the statement summary and line items for that period

#### Scenario: Customer requests an unavailable statement period

- **WHEN** the current customer requests a statement period that is not available for that customer's active wallet
- **THEN** the system returns a not-found response for that statement resource

### Requirement: Statements use settled customer-visible activity

The system SHALL build statement line items from customer-visible transaction history and SHALL exclude activity that is not part of settled statement history. Pending and failed transactions SHALL NOT appear as statement line items.

#### Scenario: Pending transaction is excluded from statement view

- **WHEN** a customer-visible transaction is still pending or has failed
- **THEN** that transaction is not included in the statement line items for the period
