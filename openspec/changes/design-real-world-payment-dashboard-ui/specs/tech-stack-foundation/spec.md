## MODIFIED Requirements

### Requirement: Web connectivity baseline

The web application SHALL run as a React and TypeScript application, support environment-based API configuration, and render a structured customer dashboard that incorporates API-backed financial data and connectivity-aware fallback states.

#### Scenario: User opens the web app locally

- **WHEN** a user loads the web application in a local development environment with the API running
- **THEN** the application renders successfully as a customer dashboard and shows API-backed financial sections

#### Scenario: User opens the web app while some endpoints are unavailable

- **WHEN** a user loads the web application and one or more dashboard endpoints cannot be reached
- **THEN** the application still renders the dashboard shell and shows clear section-level fallback states
