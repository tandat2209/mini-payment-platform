## Context

The repository already has the financial schema foundation in place, including wallets, wallet balances, user transactions, recipients, recipient rails, payouts, payout attempts, and ledger records. The API application is still minimal and only exposes a health endpoint, so this is the right point to define a clean customer-facing read API before write flows and UI work introduce coupling pressure.

This change is intentionally limited to customer reads: balances, transactions, bank statements, and recipients. Those reads should come from customer-facing tables such as `wallet_balances`, `user_transactions`, `payouts`, `recipients`, and `recipient_rails`, while keeping internal accounting tables like `ledger_entries` out of the public contract. The user also asked for a simple clean architecture, so the design should stay explicit and easy to evolve instead of jumping straight to a heavy CQRS or DDD structure.

## Goals / Non-Goals

**Goals:**

- Define a v1 customer read API contract for balances, transactions, statements, and recipients.
- Organize the NestJS API by feature module with a simple clean architecture split between HTTP, application, and infrastructure concerns.
- Ensure every query is scoped to the current customer context and does not expose another customer's data.
- Reuse the existing financial schema without requiring a new persistence model for this first read-only API.
- Make later customer-facing write flows easy to add beside the read modules without reshaping the application structure.

**Non-Goals:**

- Implement payout creation, recipient creation, funding ingestion, or any other write endpoint in this change.
- Expose ledger, webhook, reconciliation, or provider-integration records directly in the customer API.
- Introduce full production authentication or identity-provider integration in this change.
- Generate PDF statements or add asynchronous statement snapshot jobs in this change.

## Decisions

### Use feature-first simple clean architecture in the NestJS API

The API will be organized into customer-facing feature modules such as balances, transactions, statements, and recipients. Each module will keep a simple clean architecture shape:

- controller layer for request mapping and response DTOs
- application layer for query use cases
- repository ports for data access contracts
- infrastructure adapters for SQL/database access

This keeps feature ownership clear, avoids a global "services" bucket, and matches NestJS best practices for feature modules without adding unnecessary architectural ceremony.

Alternative considered:

- Organize by technical layer across the whole app: simpler at first, but it quickly spreads a single feature across many folders and makes ownership less clear.
- Adopt a heavier CQRS/event-sourcing structure now: powerful, but too much complexity for a first read-only API surface.

### Treat customer identity as a shared application boundary, not a query parameter

Customer-facing endpoints will resolve a current customer context from a shared request boundary, then pass that identity into application queries. Route and query parameters will not accept arbitrary user identifiers for customer reads.

This enforces ownership checks centrally and avoids accidentally designing an admin-style API for customer use cases. Because the repository does not yet have full authentication, the first implementation can use a temporary adapter such as a header-backed identity resolver, but the application layer should depend only on a `CurrentCustomer` abstraction so a real auth guard can replace it later.

Alternative considered:

- Accept `userId` directly in request parameters: faster to wire, but too easy to misuse and contrary to customer-facing security boundaries.

### Build read models from customer-facing tables, not ledger tables

Balances will read from `wallets` and `wallet_balances`. Transaction history and statement data will read primarily from `user_transactions`, with optional joins to `payouts` and recipients when customer-visible metadata is needed. Recipient views will read from `recipients` and `recipient_rails`.

This aligns with the financial foundation, which already defines `user_transactions` as the customer-facing history and statement source, while ledger tables remain the internal accounting truth.

Alternative considered:

- Build transactions and statements directly from ledger records: more internally accurate, but too low-level for customer-facing API contracts and more likely to leak internal accounting structure.

### Use cursor pagination for transaction history

Transaction history will paginate with a stable cursor based on descending `occurred_at` plus a tiebreaker such as `id`. Filters such as currency, status, type, and date range will be applied before pagination.

Cursor pagination fits activity feeds better than offset pagination because it stays stable as new transactions arrive and maps naturally to descending timeline queries.

Alternative considered:

- Offset pagination: easier for basic SQL, but less stable for live financial activity timelines and less efficient at deeper pages.

### Model statements as on-demand monthly read resources

The first statement API will expose available monthly statement periods and a statement detail resource per wallet, currency, year, and month. Statement detail will include opening balance, closing balance, totals, and line items derived from customer-visible transactions that belong in settled history.

This keeps the API intuitive for customer-facing statement browsing and avoids prematurely introducing pre-generated documents or statement snapshot tables. If statement generation later needs stronger audit or performance guarantees, a dedicated snapshot model can be added without invalidating the customer contract.

Alternative considered:

- Arbitrary date-range statements only: flexible, but harder to cache and less aligned with standard statement UX.
- Precomputed statement tables now: stronger for auditability, but unnecessary complexity before we have real statement volume and document requirements.

### Return customer-safe recipient rail details

Recipient responses will include rail summaries and selected rail detail fields that are safe for customer display, with sensitive account identifiers masked. The API should not expose raw `details` JSON directly.

This prevents accidental leakage of sensitive bank data and preserves flexibility if the stored rail schema evolves.

Alternative considered:

- Return raw rail JSON: easy to implement, but unsafe and tightly couples the public contract to internal storage shape.

## Risks / Trade-offs

- [Risk] The temporary customer identity adapter could leak into too many layers before a real auth system exists. → Mitigation: isolate identity resolution behind a shared boundary and keep application use cases dependent on a minimal customer-context contract.
- [Risk] Monthly statement calculation may require non-trivial balance derivation for opening and closing amounts. → Mitigation: start with indexed queries against `user_transactions` and `wallet_balances`, and add snapshotting later only if performance or audit requirements justify it.
- [Risk] Customer transaction detail may need payout- or recipient-specific enrichment that grows over time. → Mitigation: keep response mapping in dedicated DTO assemblers so enrichment can expand without rewriting repository contracts.
- [Risk] Masking recipient rail data incorrectly could either leak too much or hide too much. → Mitigation: define an explicit allowlist for response fields and cover masking behavior with tests.

## Migration Plan

1. Add a shared customer-context boundary and common customer API response primitives in the API application.
2. Add feature modules for balances, transactions, statements, and recipients using controller, query service, repository port, and SQL adapter layers.
3. Implement read queries against the existing financial schema and add any missing read indexes only if query verification shows they are needed.
4. Add controller and repository tests that verify customer scoping, transaction pagination, statement totals, and recipient masking behavior.
5. Document the endpoint contracts and temporary identity assumptions so the next implementation changes can add real auth without reshaping the modules.

Rollback is straightforward because this change is additive at the API layer. If a later implementation needs to disable the API, the feature modules can be removed without migrating persisted data.

## Open Questions

- Should the first statement detail response include only `posted` and `completed` transactions, or should it also show `reversed` entries explicitly when they affect statement history?
- What temporary request identity mechanism do we want for local development before a real authentication system exists?
- Do we want customer transaction detail to include recipient rail labels immediately, or is recipient name plus payout reference enough for v1?
