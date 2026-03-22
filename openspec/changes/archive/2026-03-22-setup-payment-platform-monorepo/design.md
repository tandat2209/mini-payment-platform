## Context

This repository is currently an empty OpenSpec workspace. The first implementation milestone is only about setting up the project structure and proving basic connectivity between the web app and API.

This change intentionally avoids business logic, database design, ledger modeling, and payout flow design. Its job is to create the three apps, standardize local development, expose a single health endpoint from the API, and have the web app call that endpoint successfully.

## Goals / Non-Goals

**Goals:**

- Create a runnable monorepo with `apps/api`, `apps/web`, and `apps/simulator`.
- Standardize local development, build, lint, and test workflows from the workspace root.
- Add a NestJS API scaffold with a single health endpoint.
- Add a React + TypeScript web app that can call the API health endpoint and show the response.
- Add a simulator app scaffold so the intended repository shape exists from the start.

**Non-Goals:**

- Implement wallet, ledger, payout, or any other payment business logic.
- Add database schema, migrations, seeds, or shared payment-domain packages.
- Design external settlement behavior, webhook flows, or accounting models.
- Build a polished UI beyond a functional connectivity check.

## Decisions

### Use `pnpm` workspaces with Turborepo for monorepo orchestration

The workspace will use `pnpm` for dependency management and local package linking, with Turborepo for task orchestration across apps. This gives us a lightweight, practical setup for a TypeScript monorepo without introducing unnecessary framework overhead.

Alternative considered:

- `npm` workspaces: simpler, but weaker ergonomics for a multi-app workspace.
- `Nx`: powerful, but more structure than this first milestone needs.

### Use NestJS for the API and simulator apps

The API and simulator will both use NestJS so the backend apps share the same module, configuration, and bootstrapping patterns. That keeps the repo consistent without introducing business behavior yet.

Alternative considered:

- Use a lighter framework for the simulator: smaller in isolation, but introduces a second backend structure too early.

### Use a Vite-based React + TypeScript app for the web frontend

The web app will use React + TypeScript with Vite so the frontend can be scaffolded quickly and focus on one job in this milestone: calling and rendering the API health response.

Alternative considered:

- Next.js: stronger for larger frontend architecture, but unnecessary for this initial connectivity milestone.

### Keep the initial API surface to a single health endpoint

The API will expose only one health endpoint in this change. This keeps the first milestone measurable and avoids inventing placeholder business modules that would likely be rewritten in later changes.

Alternative considered:

- Scaffold future wallet, ledger, and payout modules now: broader shape up front, but too much implied design for a setup-only change.

## Risks / Trade-offs

- [Risk] The first milestone could drift into business logic. → Mitigation: scope this change to scaffolding, one health endpoint, and a web connectivity check only.
- [Risk] The simulator may not add immediate user-visible value. → Mitigation: keep it as a minimal scaffold so later payout work can build on an existing app without expanding this milestone.

## Migration Plan

1. Initialize the workspace manifests, task runner configuration, and application directories.
2. Add environment templates and shared configuration conventions for the apps.
3. Scaffold the API, web app, and simulator so all three boot locally.
4. Add one API health endpoint and wire the web app to call it.
5. Validate that the root development command starts the apps and that the web app can reach the API successfully.

Rollback is straightforward because this is a net-new repository foundation: revert the scaffolding if the chosen tooling or app layout needs to change.

## Open Questions

- None for this milestone. Business logic and domain design are intentionally deferred to later changes.
