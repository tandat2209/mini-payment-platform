## Why

The project now has a realistic funding flow, but there is no operator-facing surface to drive local simulations or inspect financial records across customers. We need an admin area in the web app so demos, debugging, and financial verification do not depend on ad hoc curl commands or direct database inspection.

## What Changes

- Add an admin section in the web app with a dedicated navigation entry and operator-focused pages.
- Add an admin simulator workflow that can trigger simulator funding events from the web UI using structured inputs.
- Add admin read APIs to view user transactions across customers, not just the current demo customer.
- Add admin read APIs to view ledger transactions and ledger entries for financial inspection and reconciliation.
- Add web presentation for admin transaction and ledger exploration with filters, loading states, empty states, and error handling.

## Capabilities

### New Capabilities

- `admin-operations-ui`: Provide an admin area in the web app for financial operations, simulator controls, and accounting inspection.
- `admin-simulator-controls`: Let admins trigger simulator funding events from the web app using structured destination, amount, and remittance inputs.
- `admin-financial-observability-api`: Expose admin-scoped APIs for browsing user transactions and ledger activity across the platform.

### Modified Capabilities

None.

## Impact

- Affected code: `apps/web`, `apps/api`, and integration points that currently only support customer-scoped transaction visibility or terminal-driven simulator usage.
- Affected APIs: new admin read endpoints for transactions and ledger data, plus a new admin-facing trigger path for simulator funding actions.
- Affected systems: simulator invocation flow, transaction query surfaces, ledger query surfaces, and web routing/navigation.
- Dependencies: existing simulator funding API, existing transaction and ledger persistence tables, and current dashboard shell/components that will gain an admin section.
