## Context

The repository already models wallet funding details, webhook events, wallet balances, user transactions, and ledger postings at the database level. The web app also now presents an `Add money` action in the dashboard, but that action is not connected to a funding-details view, the API does not expose funding instructions, and the simulator cannot trigger an inbound money event.

This change is the first executable inbound-money path across the stack. It needs to connect three applications: the web app must reveal funding instructions for the current account, the simulator must be able to emit a demo funding event, and the API must ingest that event and atomically update financial records. Because the work crosses UI, read APIs, write processing, and accounting state, the implementation benefits from a shared technical design before coding starts.

## Goals / Non-Goals

**Goals:**

- Let the customer open `Add money` from the web dashboard and view active funding details for their account.
- Expose a customer-scoped API that returns active funding instructions for the current wallet.
- Expose a simulator API that sends a demo `funding.completed` webhook into the application.
- Process accepted funding webhooks idempotently and atomically across `webhook_events`, `wallet_balances`, `user_transactions`, `ledger_transactions`, and `ledger_entries`.
- Support local demos and testing without any real PSP dependency.

**Non-Goals:**

- Building a real PSP integration, signature verification scheme, or provider-specific security hardening beyond demo-safe conventions.
- Implementing card top-ups, payout settlement changes, reversals, or refund flows.
- Building a full admin UI or reconciliation dashboard for webhook operations.
- Introducing authentication beyond the current demo customer context.

## Decisions

### Decision: Add a dedicated customer funding-details read endpoint inside the wallet slice

The API will expose a customer-scoped funding details endpoint, such as `GET /customers/me/funding-details`, alongside the existing wallet balance read flow. The response will include the active wallet identity and all active funding details for that wallet so the web app can render deposit instructions without composing multiple endpoints.

This keeps active-wallet lookup logic in the same bounded context as wallet balances and avoids inventing a parallel read stack for a single wallet-owned resource.

Alternatives considered:

- Create a separate funding-read module from the start: cleaner for future growth, but unnecessary overhead for a first wallet-owned read path.
- Put funding details directly into the balance response: simpler short term, but it couples two independently cacheable resources and makes the API harder to evolve.

### Decision: Give Add money a dedicated customer page inside the app shell

Clicking `Add money` will navigate the customer to a dedicated funding-details page rather than expanding an inline dashboard panel. The page will still live inside the existing application shell, fetch funding details on demand, and present clear loading, empty, and error states as a focused money-in workspace.

This gives the flow a clearer destination, aligns better with how payment products separate overview and action-specific screens, and leaves room for future funding history, copy actions, or simulator helpers without crowding the dashboard overview.

Alternatives considered:

- Keep the funding view inline on the overview page: lighter to implement, but it dilutes the dashboard and makes the funding experience feel secondary.
- Render all funding details by default on the overview page: cheapest technically, but too noisy for the primary dashboard experience.

### Decision: Use the simulator as an HTTP webhook sender, not as a direct database mutator

The simulator will expose a trigger endpoint, such as `POST /simulate/funding`, that accepts explicit funding inputs like `amountMinor`, `currency`, `destinationType`, `destinationIdentifier`, and optional remittance metadata (`description`, `providerReference`, `sender`). The simulator will then deliver a `funding.completed` webhook over HTTP to the API application.

This preserves a realistic provider boundary and exercises the same ingestion path that a real PSP would use. It also keeps the simulator decoupled from the API database schema.

Alternatives considered:

- Write directly into the database from the simulator: fast to build, but it skips the webhook path we actually need to verify.
- Import API services directly into the simulator process: avoids HTTP, but tightly couples two apps that are meant to simulate separate systems.

### Decision: Model inbound funding processing as one transactional application flow

The API will add a dedicated funding webhook processor that:

1. Persists or detects the raw provider event using `(provider, external_event_id)`.
2. Resolves the referenced active funding detail and owning active wallet.
3. Creates or updates the target wallet balance row for the funded currency.
4. Creates one customer-visible funding transaction.
5. Creates one posted ledger transaction with balanced entries.
6. Marks the webhook record with its terminal processing outcome.

These steps will run inside one database transaction for first-time processing. Duplicate deliveries will short-circuit after webhook deduplication and SHALL NOT create additional financial side effects.

Alternatives considered:

- Split balance, user transaction, and ledger work into separate asynchronous jobs: more extensible long term, but too much failure handling and state choreography for the first inbound flow.
- Store the webhook first and process it later in a poller only: resilient, but it slows local feedback and adds infrastructure the project does not yet use.

### Decision: Target funding by external destination details, not internal identifiers

The webhook payload will include `destinationType`, `destinationIdentifier`, `currency`, and `amountMinor`. Optional remittance context such as `description`, `providerReference`, and `sender` may also be present. The processor will resolve the active funding detail by matching the external destination against the wallet funding instructions stored in `wallet_funding_details.details`, then validate currency and active-wallet ownership before applying funds.

This keeps the provider contract closer to real bank and PSP payloads, avoids leaking internal ids into the external boundary, and still ties the inbound event to the funding instructions shown in the UI.

Alternatives considered:

- Target by internal funding-detail id plus customer context: easy for local demos, but unrealistic for a provider-facing webhook.
- Target only by wallet id: technically enough for booking funds, but weaker for demonstrating “money came into this funding rail.”

### Decision: Provision missing balance rows and required ledger accounts lazily for supported currencies

If a successful funding event targets an active funding detail whose currency does not yet have a wallet balance row or required wallet/platform ledger accounts, the processor will create those records as part of the transaction before posting the funding entry.

This keeps the simulator useful across seeded funding details without requiring every supported currency to be fully pre-provisioned in seed data.

Alternatives considered:

- Fail unless every balance row and ledger account already exists: lower implementation scope, but brittle and frustrating in local demos.
- Pre-seed all wallet and platform accounts for every possible currency: workable, but less robust than ensuring the processor can prepare the minimum required accounting containers itself.

## Risks / Trade-offs

- [Risk] Local end-to-end demos now depend on both the API and simulator being configured to reach each other. → Mitigation: keep the simulator target URL explicit in environment configuration and make delivery failures visible in the simulator response.
- [Risk] Demo webhook payloads can drift from what a future real PSP would send. → Mitigation: keep the contract narrow and provider-namespaced so it can be replaced later without leaking into customer APIs.
- [Risk] Atomic funding processing increases the complexity of one database transaction. → Mitigation: keep the first flow synchronous and bounded to balance, user transaction, ledger posting, and webhook status only.
- [Risk] Lazy provisioning of ledger accounts introduces more write paths in the processor. → Mitigation: restrict provisioning to the minimum accounts required for inbound funding and keep naming/ownership rules deterministic.

## Migration Plan

1. Add OpenSpec artifacts for the new customer funding, simulator, and funding-processing behavior.
2. Implement the API read endpoint for customer funding details.
3. Implement webhook ingestion plus transactional funding processing and add automated coverage for first delivery and duplicate delivery behavior.
4. Implement the simulator funding trigger endpoint and environment-driven target configuration.
5. Implement the web `Add money` interaction and funding details view, then verify the end-to-end demo flow locally.

## Open Questions

- Should the customer-facing funding reference shown after processing reuse the provider event id, the funding detail id, or a generated internal funding reference?
