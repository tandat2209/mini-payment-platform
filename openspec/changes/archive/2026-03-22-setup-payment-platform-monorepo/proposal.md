## Why

The payment platform needs a clean monorepo foundation before we implement wallet, ledger, payout, or database behavior. Setting up the three core apps and proving that the web app can reach a running API gives us a small, reliable first milestone to build on.

## What Changes

- Create a monorepo workspace for `apps/api`, `apps/web`, and `apps/simulator`.
- Bootstrap the API as a NestJS service with a single health endpoint.
- Bootstrap the web app as a React + TypeScript application that can call the API health endpoint and render the result.
- Bootstrap the simulator as a separate app so the final repository shape is in place, without adding payout behavior yet.
- Add workspace-level scripts, environment conventions, and local development orchestration for running the apps consistently.

## Capabilities

### New Capabilities

- `workspace-foundation`: Establish workspace tooling, repository layout, and shared local development commands for the three apps.
- `api-service-bootstrap`: Provide a NestJS API scaffold with a single health endpoint for local connectivity checks.
- `web-app-bootstrap`: Provide a React + TypeScript frontend scaffold that can call and display the API health response.
- `simulator-app-bootstrap`: Provide a separate simulator app scaffold in the monorepo without adding payout logic yet.

### Modified Capabilities

- None.

## Impact

- Adds new application directories under `apps/`.
- Introduces workspace tooling, dependency management, and local run/build/test scripts.
- Establishes the repository and app boundaries that later wallet, ledger, payment event, payout, and database changes will build on.
