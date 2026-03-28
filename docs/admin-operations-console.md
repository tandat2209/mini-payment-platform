# Admin Operations Console

The admin app is now organized as a desktop-first operations console instead of a collection of isolated implementation pages.

## Information Architecture

Top-level admin workspaces:

- `Dashboard`: entry point for the most important operations surfaces
- `Transactions`: user-facing funding and payout transaction history
- `Ledger`: journal postings and ledger integrity investigation
- `Payouts`: payout lifecycle, provider attempt state, and linked webhooks
- `Recipients`: saved beneficiary records and rail readiness
- `Customers`: customer wallet registry and balance drilldown
- `Treasury`: aggregate currency balances across wallets
- `Reconciliation`: failed payouts, failed webhook processing, and unbalanced ledger exceptions
- `Webhooks`: inbound provider event history
- `Reports`: reserved reporting workspace
- `Audit Logs`: reserved audit review workspace
- `Settings`: reserved admin configuration workspace

## Route Mapping

The current admin routes are:

- `/admin`
- `/admin/transactions`
- `/admin/ledger`
- `/admin/payouts`
- `/admin/recipients`
- `/admin/customers`
- `/admin/treasury`
- `/admin/reconciliation`
- `/admin/webhooks`
- `/admin/reports`
- `/admin/audit-logs`
- `/admin/settings`

Legacy concepts were re-homed as:

- `Wallets` -> `Customers`
- `Balances` -> `Treasury`
- `Ledgers` route label -> `Ledger`

## Live Read Models

The admin console now reads from backend admin APIs instead of preview fixtures.

Current live admin reads:

- `GET /admin/wallets`
- `GET /admin/balances`
- `GET /admin/transactions`
- `GET /admin/transactions/:transactionId`
- `GET /admin/ledgers`
- `GET /admin/ledgers/:ledgerTransactionId`
- `GET /admin/payouts`
- `GET /admin/recipients`
- `GET /admin/webhooks`
- `GET /admin/reconciliation/exceptions`

These are intended to support investigation paths across customer activity, payout execution, provider callbacks, and accounting impact.

## Operator Workflows

Common workflows in the new console:

1. Customer issue investigation

- Start in `Customers`
- Open the wallet context
- Follow to `Transactions`
- Open the linked `Ledger` posting when needed

2. Payout issue investigation

- Start in `Payouts`
- Inspect provider attempt ids and webhook linkage
- Open `Webhooks` for provider evidence
- Open `Reconciliation` if the callback was rejected or the payout failed

3. Accounting integrity review

- Start in `Ledger`
- Inspect posting detail
- Cross-link back to `Transactions` or `Payouts`
- Use `Reconciliation` for unresolved exceptions

4. Treasury monitoring

- Start in `Treasury`
- Review aggregate balances by currency
- Move to `Customers` when a specific wallet needs drilldown

## Current Scope

`Reports`, `Audit Logs`, and `Settings` are currently reserved destinations in the information architecture. They exist so the navigation reflects the intended long-term operator model, even though the first slice focuses on shell, route migration, and live reads for core operations.
