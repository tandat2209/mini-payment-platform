## ADDED Requirements

### Requirement: API service exposes a health endpoint
The API SHALL run as a NestJS application and expose a single health endpoint that confirms the service is running.

#### Scenario: API boots successfully
- **WHEN** the API service starts with valid configuration
- **THEN** it initializes the NestJS application and serves the configured health endpoint

### Requirement: API allows local web connectivity
The API SHALL be configured so the local web application can call the health endpoint during development.

#### Scenario: Web app requests API health
- **WHEN** the local web application sends a request to the API health endpoint
- **THEN** the API accepts the request and returns a successful health response
