## ADDED Requirements

### Requirement: Web app provides a minimal app shell
The web application SHALL provide a React + TypeScript shell that can render a simple page for local development.

#### Scenario: User opens the web app
- **WHEN** a user loads the web application in a local development environment
- **THEN** the application renders the frontend shell successfully

### Requirement: Web app supports API-driven configuration
The web application SHALL load its API base URL and runtime configuration through environment variables or a documented configuration mechanism so it can connect to different local environments without code edits.

#### Scenario: Developer points the web app at the API
- **WHEN** a developer configures the web app with the local API base URL
- **THEN** the web app can use that configuration to prepare requests to the API without changing source code

### Requirement: Web app displays API health status
The web application SHALL call the configured API health endpoint and display the returned status in the UI.

#### Scenario: Frontend shows API connectivity result
- **WHEN** the web app successfully calls the configured API health endpoint
- **THEN** the UI shows the returned health status to confirm the frontend can reach the API
