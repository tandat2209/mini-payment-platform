## ADDED Requirements

### Requirement: Monorepo workspace structure
The repository SHALL provide a monorepo layout that contains `apps/api`, `apps/web`, and `apps/simulator`, with workspace configuration that allows all apps to be installed and run from the repository root.

#### Scenario: Workspace apps resolve from the root
- **WHEN** a contributor installs dependencies from the repository root
- **THEN** all application workspaces are discovered and can be run without manual linking

### Requirement: Shared root commands
The repository SHALL expose root-level commands for development, build, lint, and test workflows so contributors can operate the three apps consistently from one entry point.

#### Scenario: Contributor starts the platform locally
- **WHEN** a contributor runs the documented root development command
- **THEN** the repository starts or orchestrates the API, web app, and simulator through a consistent workflow

### Requirement: Environment configuration conventions
The repository SHALL define environment templates and configuration conventions for each app so local setup does not require hardcoded values or code changes.

#### Scenario: New contributor configures the workspace
- **WHEN** a contributor follows the documented environment setup steps
- **THEN** each app can load the required configuration values from local environment files or documented defaults
