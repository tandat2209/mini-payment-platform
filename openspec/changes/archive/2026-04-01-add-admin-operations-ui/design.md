## Context

The repository currently has a customer-oriented web experience, a simulator service that can trigger funding events, and API/query layers for customer transaction history plus internal ledger persistence. Operators can already validate funding flows locally, but they must do so with terminal commands, simulator curl requests, and direct database inspection. There is no dedicated admin surface in the web app for driving simulations or inspecting platform-wide financial activity.

This change spans three applications:

- `apps/web` needs an admin section with routes, navigation, and data views separate from the customer dashboard.
- `apps/api` needs admin-oriented read endpoints for user transactions and ledger data.
- `apps/psp-sandbox` remains the execution target for simulated funding, and the web sandbox workspace can call it directly for provider-style event dispatch.

Because the change crosses UI, query surfaces, and service-to-service orchestration, it benefits from an explicit design before implementation.

## Goals / Non-Goals

**Goals:**

- Add an admin section in the web app that operators can navigate to without disturbing the customer experience.
- Let admins trigger simulator funding events from the web app using structured inputs.
- Let admins browse user transactions across the platform, not just for the current customer context.
- Let admins inspect ledger transactions and entries in the web app.
- Keep the design compatible with the current demo environment while leaving room for stricter admin auth later.

**Non-Goals:**

- Building a production-grade RBAC or identity system for admin access in this change.
- Replacing the existing customer dashboard or customer APIs.
- Adding mutation workflows for ledger adjustments, reversals, or manual financial repair operations.
- Building full reconciliation reporting, exports, or audit report generation.

## Decisions

### Decision: Add a distinct admin area in the web app instead of mixing admin tools into the customer dashboard

The web app will add an admin section with its own routes and navigation entry, separate from the customer dashboard and add-money flow. Admin pages will focus on operator actions and financial observability rather than wallet ownership or customer-scoped context.

This keeps customer and admin mental models separate, avoids overloading the existing dashboard, and makes it easier to evolve admin tooling without leaking operator concepts into the customer UI.

Alternatives considered:

- Reuse the existing dashboard and hide admin features behind a toggle: faster initially, but it mixes operator workflows into a customer-facing information architecture.
- Build a separate admin app: cleaner long term, but too much overhead for the current project size.

### Decision: The web app can call the PSP sandbox directly for sandbox-only tooling

The browser-facing PSP sandbox tooling can call `apps/psp-sandbox` directly over HTTP for sandbox-only flows like funding webhooks. The API remains the receiving system for provider callbacks, but it does not need to proxy sandbox dispatch requests.

This preserves the realistic provider boundary more directly: the browser exercises the fake PSP surface, and the PSP sandbox delivers webhooks into the API just like an external provider would. The sandbox base URL remains explicit in web runtime configuration.

Alternatives considered:

- Proxy sandbox requests through the API: workable, but it adds an unnecessary hop and weakens the system boundary the sandbox is meant to exercise.
- Move the simulation logic fully into the API: possible, but it blurs the distinction between the platform and the fake PSP surface.

### Decision: Introduce admin read APIs that are platform-scoped, not customer-scoped

Admin transaction and ledger views will use dedicated admin endpoints rather than reusing customer endpoints with looser filtering. These endpoints will support platform-wide browsing, filtering, and detail inspection for:

- user transactions
- ledger transactions
- ledger entries associated with a selected ledger transaction

This keeps customer access semantics intact and makes the admin contract explicit.

Alternatives considered:

- Add optional “all users” flags to customer endpoints: too risky, because it blurs access boundaries and intent.
- Query the database directly from the web app: unacceptable layering and no reusable API contract.

### Decision: Model ledger browsing around ledger transactions first, then entries detail

The admin ledger surface will list ledger transactions as the primary unit and reveal the associated ledger entries in a detail view. This matches how accountants and operators usually inspect postings: first identify the booking event, then inspect the debit/credit lines beneath it.

This also aligns better with the existing schema relationship between `ledger_transactions` and `ledger_entries`.

Alternatives considered:

- List raw ledger entries only: too noisy and harder to reason about as a financial event stream.
- Aggregate ledger data into balances only: useful later, but insufficient for operator inspection.

### Decision: Keep admin access demo-safe and structurally ready for future auth

This change will use the project’s current lightweight environment assumptions for admin access, but the new routes, controllers, and UI should be structured so a future admin guard or role check can be added without reworking the entire flow.

This keeps the project moving while respecting the likely future need for stronger access control.

Alternatives considered:

- Delay the feature until full auth exists: too much friction for the current stage of the project.
- Ignore future auth boundaries entirely: would create unnecessary rework later.

## Risks / Trade-offs

- [Risk] Admin routes may duplicate query logic that already exists for customer views. -> Mitigation: reuse repository/query patterns where the data shape overlaps, but keep admin contracts separate.
- [Risk] Direct browser-to-sandbox calls require CORS and an explicit sandbox base URL. -> Mitigation: enable CORS in `apps/psp-sandbox` and keep the sandbox base URL explicit in web runtime configuration.
- [Risk] Platform-wide transaction and ledger views may become large quickly. -> Mitigation: require pagination and filtering from the start, even in the initial admin UI.
- [Risk] Demo-safe admin access could be mistaken for a production access model. -> Mitigation: document clearly that this change is structurally admin-ready, not production-auth complete.

## Migration Plan

1. Add the new admin capability specs and implementation tasks.
2. Implement admin API endpoints for transaction browsing and ledger browsing.
3. Implement the admin and PSP sandbox web routes and pages using those APIs and the sandbox HTTP surface.
4. Verify the local flow end to end by triggering funding from the PSP sandbox UI and inspecting resulting transaction and ledger records.
5. Layer in stricter admin authentication later without changing the route and API structure.

## Open Questions

- Should the admin ledger view expose only posted ledger transactions initially, or also surface future draft/reversed states as those are introduced?
- Should the admin transaction list support customer search by external ref, user id, or both in the first iteration?
