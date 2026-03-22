## 1. Workspace Foundation

- [x] 1.1 Initialize the root workspace files (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, shared TypeScript config, and basic lint/test scripts).
- [x] 1.2 Create the monorepo directory structure for `apps/api`, `apps/web`, and `apps/simulator`.
- [x] 1.3 Add local environment templates and shared service configuration for the three apps.
- [x] 1.4 Document the root development workflow and setup steps for contributors.

## 2. API Service Bootstrap

- [x] 2.1 Scaffold the NestJS API application with workspace-aware build and development scripts.
- [x] 2.2 Implement a single health endpoint that returns a simple success payload.
- [x] 2.3 Configure the API for local frontend access so the web app can call the health endpoint during development.

## 3. Simulator App Bootstrap

- [x] 3.1 Scaffold the simulator as a separate application with its own configuration and development scripts.
- [x] 3.2 Ensure the simulator can be started independently and through the root workspace command.

## 4. Web App Bootstrap

- [x] 4.1 Scaffold the web app with React, TypeScript, Vite, and workspace-aware build and development scripts.
- [x] 4.2 Add environment-based API configuration for the API base URL.
- [x] 4.3 Build a simple page that calls the API health endpoint and renders the returned status.

## 5. Verification

- [x] 5.1 Verify the root development command starts the API, the web app, and the simulator together.
- [x] 5.2 Verify the API health endpoint returns a successful response locally.
- [x] 5.3 Verify the web app can connect to the API and display the health response.
