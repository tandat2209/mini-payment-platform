# tech-stack-foundation Specification

## Purpose

Define the baseline repository structure and development stack for the payment platform mini project so future wallet, ledger, payout, and database changes build on a stable foundation.

## Requirements

### Requirement: Monorepo foundation

The repository SHALL provide a monorepo layout with `apps/api`, `apps/web`, and `apps/simulator`, along with root-level workspace configuration that allows contributors to install, build, lint, test, and run the applications from the repository root.

#### Scenario: Contributor starts the workspace

- **WHEN** a contributor installs dependencies and runs the documented root development command
- **THEN** the API, web app, and simulator are started through a consistent workspace workflow

### Requirement: Shared local configuration

The repository SHALL define documented environment configuration conventions for each application so local setup does not require source code changes.

#### Scenario: Contributor configures local development

- **WHEN** a contributor follows the documented environment setup steps
- **THEN** each application can load its required local configuration from environment files or documented defaults

### Requirement: API health baseline

The API SHALL run as a NestJS application and expose a health endpoint that confirms the service is running and reachable from the local web application.

#### Scenario: Frontend checks API health

- **WHEN** the local web application sends a request to the API health endpoint
- **THEN** the API returns a successful health response

### Requirement: Web connectivity baseline

The web application SHALL run as a React and TypeScript application, support environment-based API configuration, and display the API health response in the UI.

#### Scenario: User opens the web app locally

- **WHEN** a user loads the web application in a local development environment with the API running
- **THEN** the application renders successfully and shows the API health status

### Requirement: Simulator application baseline

The repository SHALL include a separate simulator application that runs as part of the monorepo development workflow so future payout simulation behavior can be added without restructuring the project.

#### Scenario: Contributor runs the simulator

- **WHEN** a contributor starts the workspace or runs the simulator directly
- **THEN** the simulator boots successfully as an independent application
