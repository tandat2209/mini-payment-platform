## Context

The current admin area was introduced incrementally to support transaction inspection, ledger browsing, PSP sandbox controls, and wallet/balance previews. That incremental path helped unblock implementation, but it left the admin experience with duplicated concepts, placeholder pages, and an information architecture that reflects implementation history more than operator workflows.

The main friction points are:

- top-level `Wallets` and `Balances` overlap without clearly separating customer drilldown from treasury exposure,
- payout operations, recipients, webhooks, and reconciliation concerns are spread across multiple mental models,
- the shell does not yet match common desktop operations-console patterns,
- some admin surfaces still rely on preview data rather than authoritative read models.

This change reframes the admin app as a desktop-only operations console with explicit domains for customer operations, treasury, payouts, reconciliation, and auditability.

## Goals / Non-Goals

**Goals:**

- Establish a durable admin shell with a topbar and a section-based sidebar suitable for daily operator use.
- Replace duplicated admin concepts with clearer workspace boundaries, especially by splitting customer wallet drilldown from treasury-level currency exposure.
- Define the target workspace taxonomy for dashboard, transactions, ledger, payouts, recipients, customers, treasury, reconciliation, webhooks, reports, audit logs, and settings.
- Ensure each admin page is backed by live admin read APIs rather than preview fixtures.
- Define cross-linking expectations between operational and accounting surfaces so transactions, ledgers, payouts, webhooks, and exceptions can be investigated together.

**Non-Goals:**

- Implement every proposed workspace in full detail in a single slice.
- Introduce operator write workflows such as manual adjustments, sweep approval, or settings management in this proposal.
- Redesign the customer or sandbox applications beyond the admin shell boundaries needed for routing and navigation consistency.
- Finalize finance reporting semantics such as revaluation, settlement accounting, or sweep automation beyond what the admin IA needs to represent.

## Decisions

### 1. Use a desktop-only admin shell with topbar + sidebar

The admin app will use a standard operations-console layout:

- topbar for global search, alerts, and operator session controls,
- left sidebar for section navigation,
- a persistent main content frame for list/detail workflows.

Why:

- this matches how finance and operations tools are commonly organized,
- it supports dense navigation without overloading the content region,
- it separates product navigation from workspace controls more clearly than the current page-by-page composition.

Alternative considered:

- continue evolving the current shell incrementally. Rejected because it preserves the current ambiguity around section ownership and duplicated pages.

### 2. Replace standalone Wallets/Balances with Customers/Treasury

The current `Wallets` and `Balances` pages describe two different operator questions:

- which wallets belong to which customers and what balances do they hold,
- what currency exposure exists across the platform.

These should become:

- `Customers`: customer identity, wallets, funding details, and recipient/payout drilldowns,
- `Treasury`: aggregate balances, platform cash, payable exposure, transferable funds, and later sweeps.

Why:

- it prevents wallet registry and treasury exposure from competing as peers,
- it matches industry practice where customer operations and treasury operations are distinct domains,
- it creates a clean home for future cash and sweep workflows.

Alternative considered:

- keep `Wallets` and `Balances` as separate top-level peers. Rejected because it preserves duplication and weakens the admin information architecture.

### 3. Roll out the IA as read-model-backed workspaces

Each admin workspace will be backed by an explicit admin read model rather than by preview constants or ad hoc table queries embedded in the UI.

Initial read models should cover:

- wallet registry,
- treasury balance summaries,
- payout operations,
- webhook queues,
- reconciliation exceptions.

Why:

- it keeps the web layer feature-first and page-focused,
- it prevents placeholder surfaces from drifting away from backend truth,
- it aligns with the existing query-oriented NestJS architecture already used for admin transactions and ledgers.

Alternative considered:

- complete the UI structure first and backfill APIs later. Rejected because it would repeat the placeholder drift already visible in wallet and balance pages.

### 4. Make cross-linking a first-class operator workflow

Admin pages should be designed around investigation paths, not isolated tables. The console should support drilldowns such as:

- transaction -> ledger postings,
- payout -> attempts -> webhook events,
- webhook -> reconciliation exception,
- customer -> wallet -> transactions / recipients / payouts.

Why:

- operator tools are valuable when they shorten the path from symptom to root cause,
- the product already has the underlying identifiers and relationships,
- this reduces the need for direct database inspection during demos and debugging.

Alternative considered:

- keep each page independent and rely on search. Rejected because it makes multi-step financial investigation slower and more error-prone.

### 5. Phase implementation by shell, consolidation, then new workspaces

The implementation should proceed in layers:

1. admin shell and navigation taxonomy,
2. consolidate current pages into the new structure,
3. replace preview-backed pages with live APIs,
4. add missing workspaces such as payouts, reconciliation, webhooks, and audit logs.

Why:

- it preserves momentum,
- it reduces migration risk,
- it allows incremental replacement of current routes rather than a hard cutover.

## Risks / Trade-offs

- [Scope expansion] -> The target IA introduces many workspaces, so implementation can sprawl. Mitigation: phase delivery and require each workspace to justify its API/read-model surface.
- [Naming churn] -> Renaming sections from `Wallets`/`Balances` to `Customers`/`Treasury` may temporarily confuse current users. Mitigation: keep route redirects and transitional copy during rollout.
- [Partial parity] -> Some sections may initially be shell-level placeholders while core flows are migrated. Mitigation: make readiness explicit and prioritize operationally critical sections first.
- [Backend surface growth] -> Admin read APIs will expand. Mitigation: keep them query-oriented, feature-owned, and separate from customer APIs.
- [Information density] -> A richer ops console can become visually heavy. Mitigation: standardize list/detail patterns, default filters, and compact metadata presentation.

## Migration Plan

1. Add the new admin shell and navigation model while preserving existing routes.
2. Introduce redirects or relabeling so current `Wallets` and `Balances` routes map into `Customers` and `Treasury`.
3. Replace preview-backed pages with live admin read APIs.
4. Add new workspaces in descending operational priority: `Payouts`, `Recipients`, `Webhooks`, `Reconciliation`, then `Reports` and `Audit Logs`.
5. Remove obsolete preview data and deprecated navigation entries once parity is reached.

Rollback:

- restore the previous admin navigation and route labels,
- keep new admin read APIs additive where possible so rollback is mostly a web-layer concern.

## Open Questions

- Should `Recipients` live as a first-class top-level workspace, or remain nested under `Payouts` or `Customers`?
- Should `Reports` and `Audit Logs` launch as real views in this change, or only as reserved IA destinations?
- Should the topbar global search query every admin domain immediately, or begin with transactions, ledgers, payouts, and webhooks only?
- How much operator metadata should be shown inline versus in drawers/detail views for dense sections such as reconciliation and payouts?
