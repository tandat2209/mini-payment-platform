# customer-recipient-onboarding-api Specification

## Purpose

Define the customer-facing APIs for recipient onboarding before payout initiation.

## Requirements

### Requirement: Customer can discover recipient rail requirements

The system SHALL expose a customer-facing requirement discovery endpoint for recipient onboarding that returns the required and optional fields for a recipient rail based on the selected rail, recipient country, and payout currency.

#### Scenario: Customer selects SEPA payout rail

- **WHEN** the customer requests recipient requirements for rail `sepa`, country `DE`, and currency `EUR`
- **THEN** the system returns a requirement set that includes IBAN and excludes unsupported field types for that combination

### Requirement: Customer can create a recipient before payout

The system SHALL allow the current customer to create a recipient with recipient identity data and at least one rail detail set before any payout is initiated.

#### Scenario: Customer creates a recipient with one rail

- **WHEN** the customer submits valid recipient identity data and valid rail details for a supported rail
- **THEN** the system creates the recipient, creates the recipient rail, and returns the new recipient resource

### Requirement: Customer can add additional rails to an existing recipient

The system SHALL allow the current customer to attach an additional rail detail set to an existing recipient they own without duplicating the recipient identity record.

#### Scenario: Customer adds SWIFT rail after ACH rail already exists

- **WHEN** the customer submits valid SWIFT rail details for an existing recipient they own
- **THEN** the system creates a new recipient rail under the existing recipient instead of creating a duplicate recipient

### Requirement: Recipient onboarding validates rail details before activation

The system SHALL validate recipient rail payloads against the requirement set for the selected rail, country, and currency before the recipient rail can become active.

#### Scenario: Customer omits a required SWIFT code

- **WHEN** the customer submits a SWIFT recipient rail without a required SWIFT/BIC field
- **THEN** the system rejects the request and reports the missing required field
