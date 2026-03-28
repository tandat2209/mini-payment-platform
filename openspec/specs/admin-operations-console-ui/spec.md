# admin-operations-console-ui Specification

## Purpose

Define the desktop-first admin operations console shell, navigation model, and persistent investigation context.

## Requirements

### Requirement: Admin app provides a desktop operations console shell

The system SHALL render the admin application as a desktop-first operations console with a persistent topbar, a persistent left sidebar, and a main content frame suitable for dense operator workflows.

#### Scenario: Operator opens the admin app on desktop

- **WHEN** the operator navigates to an admin route on a desktop viewport
- **THEN** the interface shows a topbar, a sidebar, and a persistent main content region

#### Scenario: Operator opens the admin app on mobile

- **WHEN** the operator navigates to an admin route on a narrow viewport
- **THEN** the interface does not expose the full admin workspace and instead indicates that the admin console is desktop-only

### Requirement: Admin topbar provides global operator utilities

The system SHALL provide a topbar with global search, alerts, and operator session controls so cross-workspace actions do not depend on page-specific UI.

#### Scenario: Operator uses topbar utilities

- **WHEN** the admin shell is rendered
- **THEN** the operator can identify global search, alerts, and session controls without opening a specific page

### Requirement: Admin sidebar reflects the operations workspace taxonomy

The system SHALL present sidebar navigation for dashboard, transactions, ledger, payouts, recipients, customers, treasury, reconciliation, webhooks, reports, audit logs, and settings.

#### Scenario: Operator scans primary navigation

- **WHEN** the admin sidebar is rendered
- **THEN** the operator can identify the major operations domains from the navigation without relying on implementation-specific page names

### Requirement: Admin console preserves context while navigating detail workflows

The system SHALL keep the admin shell persistent while operators move between list views, detail drawers, and linked investigations so workflow context is not lost during navigation.

#### Scenario: Operator drills from transactions into ledger detail

- **WHEN** the operator opens a linked ledger or payout detail from an admin page
- **THEN** the shell remains persistent and the operator stays within the admin workspace context
