## Why

The current admin area grew out of implementation slices, so it now feels like a collection of operator demos rather than one coherent operations console. Wallets and balances overlap, payout operations are split across customer/admin/sandbox mental models, and the shell does not yet reflect the way finance and operations teams actually navigate transactions, treasury, reconciliation, and audit work.

## What Changes

- Redesign the admin shell around a professional operations console with a persistent desktop sidebar and a topbar for global search, alerts, and operator profile actions.
- Replace the current top-level `Wallets` and `Balances` split with clearer domains such as `Customers` and `Treasury`, so aggregate exposure and customer wallet drilldown no longer compete with each other.
- Introduce a normalized admin information architecture with dedicated workspaces for dashboard, transactions, ledger, payouts, recipients, customers, treasury, reconciliation, webhooks, reports, audit logs, and settings.
- Define which current pages become primary operator views, which are merged, and which remain detail workflows under broader sections.
- Add or formalize admin read APIs needed to support the new sections with live data instead of preview placeholders.
- Standardize admin page behavior for desktop-only access, list/detail layouts, filter bars, empty states, exception visibility, and cross-linking between transactions, ledgers, payouts, webhooks, and reconciliation items.

## Capabilities

### New Capabilities

- `admin-operations-console-ui`: Provide a desktop-first admin shell with topbar navigation, alerts, global search, section-based routing, and operator-focused page composition.
- `admin-operations-information-architecture`: Define the admin workspace taxonomy and how existing pages map into `Transactions`, `Ledger`, `Payouts`, `Recipients`, `Customers`, `Treasury`, `Reconciliation`, `Webhooks`, `Reports`, and `Audit Logs`.
- `admin-operations-read-api`: Expose the admin-scoped wallet, treasury, payout, webhook, and reconciliation read models needed to power the new console with live data.

### Modified Capabilities

- `wallets`: Expand wallet requirements to cover admin wallet registry and treasury-oriented balance aggregation, not just customer-scoped wallet views.

## Impact

- Affected code: `apps/web` admin shell, routing, navigation, and admin feature modules; `apps/api` admin read controllers and repositories; supporting docs and OpenSpec deltas.
- Affected APIs: existing admin transaction and ledger endpoints plus new or expanded admin wallet, treasury, payout, webhook, and reconciliation reads.
- Affected systems: admin desktop UX, payout operations workflow, financial observability surfaces, and future reconciliation/reporting workflows.
- Dependencies: existing transaction, payout, ledger, wallet, and webhook persistence models; current PSP sandbox payout/funding flows; the feature-first web structure already in place.
