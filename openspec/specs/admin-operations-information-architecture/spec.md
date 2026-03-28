# admin-operations-information-architecture Specification

## Purpose

Define the admin workspace taxonomy and the separation between customer operations, treasury monitoring, and investigation workflows.

## Requirements

### Requirement: Admin information architecture separates customer operations from treasury operations

The system SHALL separate customer-centric operational views from treasury-centric aggregate views so wallet registry and currency exposure are not modeled as overlapping top-level pages.

#### Scenario: Operator needs customer wallet drilldown

- **WHEN** the operator wants to inspect a customer's wallets, balances, and related activity
- **THEN** the workflow belongs to the `Customers` workspace rather than a treasury aggregate page

#### Scenario: Operator needs platform currency exposure

- **WHEN** the operator wants to inspect aggregate balances, payable exposure, or transferable funds by currency
- **THEN** the workflow belongs to the `Treasury` workspace rather than a wallet registry page

### Requirement: Admin workspaces group pages by operator intent

The system SHALL organize admin workspaces by operator intent, including operational investigation, treasury monitoring, reconciliation, reporting, and audit review.

#### Scenario: Operator investigates a failed payout

- **WHEN** the operator follows a payout issue from operational status to provider event and accounting impact
- **THEN** the navigation structure presents a clear path through `Payouts`, `Webhooks`, `Reconciliation`, and `Ledger`

### Requirement: Existing admin pages map into the new workspace taxonomy

The system SHALL define how current admin routes and pages are migrated into the new taxonomy so no legacy page remains without a clear parent workspace.

#### Scenario: Legacy wallet and balance pages are consolidated

- **WHEN** the admin IA is applied
- **THEN** standalone `Wallets` and `Balances` concepts are re-homed under `Customers` and `Treasury` with defined migration behavior

### Requirement: Admin workspace labels favor operator language over implementation language

The system SHALL use workspace labels that describe business and operations concerns rather than internal implementation slices or temporary demo page names.

#### Scenario: Operator scans the sidebar

- **WHEN** the admin navigation is displayed
- **THEN** the labels describe operational domains such as `Treasury` and `Reconciliation` instead of ambiguous or overlapping implementation-era names
