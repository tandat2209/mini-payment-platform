## ADDED Requirements

### Requirement: Simulator app scaffold exists
The repository SHALL include a separate simulator application scaffold so future payout simulator behavior can be added without restructuring the monorepo.

#### Scenario: Developer starts the simulator locally
- **WHEN** the contributor runs the simulator application in the workspace
- **THEN** the simulator boots successfully as an independent app

### Requirement: Simulator runs as a workspace app
The simulator SHALL run as part of the monorepo development workflow and use the same configuration conventions as the rest of the stack.

#### Scenario: Developer starts the workspace
- **WHEN** the contributor runs the workspace development flow
- **THEN** the simulator starts with its configured port as part of the workspace apps
