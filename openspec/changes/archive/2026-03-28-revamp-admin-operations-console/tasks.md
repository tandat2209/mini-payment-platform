## 1. Admin Shell And Navigation

- [x] 1.1 Implement the desktop-first admin shell with topbar, sidebar, and desktop-only access behavior
- [x] 1.2 Replace the current admin navigation with the new workspace taxonomy and route mapping
- [x] 1.3 Add shared admin page patterns for topbar actions, filter bars, list/detail layouts, empty states, and linked drilldowns

## 2. Workspace Consolidation

- [x] 2.1 Consolidate the current wallet and balance experiences into `Customers` and `Treasury`
- [x] 2.2 Re-home existing transaction and ledger pages under the new admin shell without losing detail workflows
- [x] 2.3 Add initial top-level workspaces for `Payouts`, `Recipients`, `Reconciliation`, `Webhooks`, `Reports`, and `Audit Logs`

## 3. Admin Read Models

- [x] 3.1 Implement live admin wallet registry and treasury balance summary APIs
- [x] 3.2 Implement admin read models for payout operations, webhook queues, and reconciliation exceptions
- [x] 3.3 Expose linked identifiers and detail payloads needed for cross-navigation between transactions, ledger entries, payouts, webhooks, and reconciliation records

## 4. Migration And Verification

- [x] 4.1 Remove preview-backed admin data sources and deprecated admin page labels once live routes are in place
- [x] 4.2 Verify the new admin shell and navigation on desktop, including route transitions and section highlighting
- [x] 4.3 Verify live data rendering and investigation flow across `Customers`, `Treasury`, `Transactions`, and `Ledger`
- [x] 4.4 Document the new admin information architecture, route mapping, and operator workflows
