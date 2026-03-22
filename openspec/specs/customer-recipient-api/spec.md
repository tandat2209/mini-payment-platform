# customer-recipient-api Specification

## Purpose

Define the customer-facing recipient read API for browsing saved recipients and viewing masked recipient details.

## Requirements

### Requirement: Customer can browse recipients

The system SHALL allow the current customer to retrieve saved recipients that belong to that customer. Each recipient item SHALL include the recipient identifier, display name, status, created timestamp, and customer-safe rail summaries for active rails.

#### Scenario: Customer retrieves recipient list

- **WHEN** the current customer requests the recipient list
- **THEN** the system returns only recipients owned by that customer

### Requirement: Customer can view recipient detail

The system SHALL allow the current customer to retrieve a saved recipient by identifier. The detail response SHALL include the recipient's active rails, default-rail indicator, and customer-safe rail detail fields needed for display.

#### Scenario: Customer retrieves recipient detail

- **WHEN** the current customer requests a recipient that belongs to that customer
- **THEN** the system returns the recipient and its active rail details

### Requirement: Recipient rail details are masked for customer display

The system SHALL expose recipient rail details in a masked customer-safe form and SHALL NOT return raw sensitive account identifiers from stored rail metadata.

#### Scenario: Customer views bank account recipient details

- **WHEN** the current customer retrieves a recipient rail that contains bank account identifiers
- **THEN** the system returns masked identifiers suitable for customer display rather than raw stored values

### Requirement: Recipient queries are customer scoped

The system SHALL scope recipient list and detail queries to the current customer context and SHALL NOT expose recipients that belong to any other customer.

#### Scenario: Customer requests another customer's recipient

- **WHEN** the current customer requests a recipient identifier that is not owned by that customer
- **THEN** the system returns a not-found response for that recipient resource
