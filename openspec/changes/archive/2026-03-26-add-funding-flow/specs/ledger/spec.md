## ADDED Requirements

### Requirement: Successful funding processing creates one balanced ledger posting

The system SHALL create exactly one posted ledger transaction for each successfully processed funding webhook and SHALL record balanced debit and credit ledger entries in the funded currency linked to that webhook event.

#### Scenario: Funding webhook posts ledger entries

- **WHEN** a valid funding webhook is processed for the first time
- **THEN** the system creates one posted ledger transaction linked to the webhook and stores balanced debit and credit entries for the funded amount

### Requirement: Duplicate funding deliveries do not duplicate ledger postings

The system SHALL NOT create additional ledger transactions or ledger entries when a previously processed provider event is delivered again.

#### Scenario: Duplicate funding webhook is replayed after posting

- **WHEN** the same provider event is delivered again after a successful funding posting already exists
- **THEN** the system keeps the original ledger posting as the only accounting result for that provider event
