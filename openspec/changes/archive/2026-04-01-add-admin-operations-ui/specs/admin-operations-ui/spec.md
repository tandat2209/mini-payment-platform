## ADDED Requirements

### Requirement: Admin area is available in the web app

The web app SHALL provide an admin section with dedicated navigation and pages separate from the customer dashboard experience.

#### Scenario: Admin opens the admin area

- **WHEN** an operator navigates to the admin section in the web app
- **THEN** the application shows admin-focused navigation and content without replacing the customer dashboard routes

### Requirement: Operators can operate PSP sandbox funding from the web app

The PSP sandbox area SHALL provide a funding form that captures structured inputs and submits them directly to the PSP sandbox for execution.

#### Scenario: Operator triggers a PSP sandbox funding event

- **WHEN** an operator submits a valid funding request from the PSP sandbox UI
- **THEN** the web app sends the request to the PSP sandbox endpoint and shows the resulting delivery status and event identifier

### Requirement: Admin can browse transactions and ledger activity from the web app

The admin area SHALL provide operator-facing views for platform transactions and ledger activity, including loading, empty, and error states.

#### Scenario: Admin inspects financial activity

- **WHEN** an operator opens the transactions or ledger section in the admin UI
- **THEN** the application shows the corresponding data view with filters and detail inspection affordances
