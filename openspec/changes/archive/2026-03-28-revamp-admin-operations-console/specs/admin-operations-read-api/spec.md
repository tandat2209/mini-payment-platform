## ADDED Requirements

### Requirement: Admin console pages use admin-scoped read models

The system SHALL power admin console pages from admin-scoped read APIs instead of preview fixtures or customer-scoped endpoints.

#### Scenario: Operator opens an admin page

- **WHEN** an admin workspace is rendered
- **THEN** the data shown comes from an admin read model designed for operator use

### Requirement: Admin read APIs expose wallet registry and treasury summaries

The system SHALL expose admin read APIs for wallet registry data and aggregate treasury balance summaries so the `Customers` and `Treasury` workspaces can use live platform data.

#### Scenario: Operator opens customer wallet registry

- **WHEN** the operator opens the wallet registry within the admin console
- **THEN** the system returns wallet identity, customer context, lifecycle status, and per-currency balances

#### Scenario: Operator opens treasury summary

- **WHEN** the operator opens a treasury balance page
- **THEN** the system returns aggregate per-currency exposure suitable for platform-level monitoring

### Requirement: Admin read APIs expose payout, webhook, and reconciliation views

The system SHALL expose admin read models for payout operations, webhook processing, and reconciliation exceptions so those workspaces can be implemented without direct database inspection.

#### Scenario: Operator opens payout operations

- **WHEN** the operator opens a payouts workspace
- **THEN** the system returns payout lifecycle, provider attempt state, and related identifiers needed for operations

#### Scenario: Operator opens reconciliation exceptions

- **WHEN** the operator opens a reconciliation workspace
- **THEN** the system returns unresolved or mismatched operational records suitable for triage

### Requirement: Admin read APIs support cross-linking between operational domains

The system SHALL expose identifiers and linked context needed to navigate between transactions, ledger postings, payouts, webhooks, and reconciliation records.

#### Scenario: Operator follows a linked investigation path

- **WHEN** the operator opens a transaction, payout, or webhook detail
- **THEN** the response includes enough linked context to continue the investigation in related admin workspaces
