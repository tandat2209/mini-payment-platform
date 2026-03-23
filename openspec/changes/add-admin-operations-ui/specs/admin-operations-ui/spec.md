## ADDED Requirements

### Requirement: Admin area is available in the web app

The web app SHALL provide an admin section with dedicated navigation and pages separate from the customer dashboard experience.

#### Scenario: Admin opens the admin area

- **WHEN** an operator navigates to the admin section in the web app
- **THEN** the application shows admin-focused navigation and content without replacing the customer dashboard routes

### Requirement: Admin can operate simulator funding from the web app

The admin area SHALL provide a simulator form that captures structured funding inputs and submits them to the application for simulator execution.

#### Scenario: Admin triggers a simulator funding event

- **WHEN** an operator submits a valid simulator funding request from the admin UI
- **THEN** the web app sends the request to the admin simulator endpoint and shows the resulting delivery status and event identifier

### Requirement: Admin can browse transactions and ledger activity from the web app

The admin area SHALL provide operator-facing views for platform transactions and ledger activity, including loading, empty, and error states.

#### Scenario: Admin inspects financial activity

- **WHEN** an operator opens the transactions or ledger section in the admin UI
- **THEN** the application shows the corresponding data view with filters and detail inspection affordances
