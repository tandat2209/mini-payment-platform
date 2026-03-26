## ADDED Requirements

### Requirement: Successful funding processing creates one customer-visible funding transaction

The system SHALL create one completed credit `user_transactions` record for each successfully processed funding webhook. The transaction SHALL be linked to the active wallet and webhook event and SHALL store statement-ready gross, fee, and net amount fields for the funded currency.

#### Scenario: Funding webhook creates customer transaction history

- **WHEN** a valid funding webhook is processed successfully
- **THEN** the system creates one completed customer-visible funding transaction for that funded amount

### Requirement: Duplicate funding deliveries do not duplicate customer history

The system SHALL NOT create more than one customer-visible funding transaction for the same provider external event.

#### Scenario: Duplicate funding webhook is replayed after transaction creation

- **WHEN** the same provider event is delivered again after the funding transaction already exists
- **THEN** the system keeps the original funding transaction as the only customer-visible history entry for that provider event
