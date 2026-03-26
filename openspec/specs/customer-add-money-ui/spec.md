# customer-add-money-ui Specification

## Purpose

Define the customer-facing add money UI and funding details experience.

## Requirements

### Requirement: Customer can open funding details from the Add money action

The web application SHALL expose an `Add money` action from the customer dashboard and SHALL display the active funding details for the current account when that action is selected.

#### Scenario: Customer opens Add money with available funding details

- **WHEN** the customer selects `Add money` and active funding details are available
- **THEN** the application displays the account funding details, including the supported rails and currencies for that account

### Requirement: Add money UI handles funding detail loading and unavailable states

The web application SHALL present clear loading, empty, and error states for the funding details view without breaking the rest of the dashboard experience.

#### Scenario: Funding details are loading

- **WHEN** the customer opens `Add money` before the funding details request completes
- **THEN** the application shows a loading state within the funding details view

#### Scenario: Funding details are unavailable

- **WHEN** the funding details request returns no active details or fails
- **THEN** the application shows an informative empty or error state in the funding details view
