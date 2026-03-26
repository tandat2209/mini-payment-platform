# customer-activity-workspace-ui Specification

## Purpose

Define the customer-facing activity workspace for recent transactions, recipients, and statements.

## Requirements

### Requirement: Overview shows recent transaction activity

The system SHALL present recent transactions in a structured activity section with status, direction, amount, and timing so customers can quickly scan recent money movement.

#### Scenario: Customer views recent transactions

- **WHEN** transaction history is available
- **THEN** the dashboard shows a recent activity section with transaction rows ordered by recency

### Requirement: Overview includes recipient and statement access panels

The system SHALL present recipient and statement information as supporting overview panels so customers can quickly reach saved payout destinations and downloadable statement periods.

#### Scenario: Customer views supporting finance panels

- **WHEN** the overview dashboard is rendered
- **THEN** the customer sees dedicated sections for recipients and statement access alongside primary activity

### Requirement: Activity workspace supports section-level loading and error states

The system SHALL allow transaction, recipient, and statement sections to load or fail independently so a partial API outage does not prevent the rest of the dashboard from rendering.

#### Scenario: Transactions fail while recipients succeed

- **WHEN** the transaction query fails and the recipient query succeeds
- **THEN** the dashboard shows an error state for transactions while still rendering the recipient section with data

### Requirement: Activity workspace preserves product-grade readability

The system SHALL present recent transactions, recipients, and statement summaries using readable spacing, labels, status treatments, and numeric hierarchy appropriate for a financial dashboard.

#### Scenario: Customer scans activity workspace

- **WHEN** the overview dashboard is rendered with activity data
- **THEN** the information is visually organized for quick scanning without appearing as raw debug output
