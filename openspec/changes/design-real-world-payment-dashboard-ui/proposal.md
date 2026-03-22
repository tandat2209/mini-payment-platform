## Why

The current web app is only a connectivity placeholder and does not resemble a real payment product. We need a customer-facing dashboard that feels credible for day-to-day money management, so future payout, statement, and recipient work lands inside a UI that already has the right structure and product language.

## What Changes

- Replace the current single-card health-check page with a multi-section customer dashboard modeled on real payment platforms.
- Add a durable application shell with sidebar navigation, topbar context, quick actions, and responsive behavior for desktop and mobile.
- Add a financial overview area with total balance, currency cards, KPI summaries, and wallet status presentation.
- Add an activity workspace with recent transactions, recipient shortcuts, and statement access cards that reflect the existing read-only API surface.
- Establish a stronger visual system for the web app, including typography, spacing, surfaces, and data-card patterns suitable for a production-style fintech product.

## Capabilities

### New Capabilities

- `customer-dashboard-layout-ui`: Real-world customer dashboard shell with navigation, topbar context, responsive structure, and quick actions.
- `customer-financial-overview-ui`: Overview panels for total balance, wallet summary, currency balances, and KPI-style money insights.
- `customer-activity-workspace-ui`: Read-only activity area for transactions, recipients, and statements presented in a product-grade dashboard layout.

### Modified Capabilities

- `tech-stack-foundation`: The web application baseline will evolve from a simple API health check screen into a structured dashboard while preserving environment-based API connectivity.

## Impact

- Affected code: `apps/web/src/App.tsx`, `apps/web/src/styles.css`, and supporting client-side API types/helpers.
- Affected specs: new UI capability specs plus a modification to `tech-stack-foundation`.
- Dependencies: no new backend dependencies; the dashboard will consume the existing read-only API and gracefully handle unavailable data during local development.
