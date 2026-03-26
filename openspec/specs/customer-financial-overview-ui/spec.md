# customer-financial-overview-ui Specification

## Purpose

Define the customer-facing financial overview experience for balances, wallet context, and money insights.

## Requirements

### Requirement: Overview presents total balance and wallet status

The system SHALL present a primary financial summary that includes the customer's total available balance, wallet identity context, and wallet status in a format suitable for a payment platform overview page.

#### Scenario: Customer views the financial summary

- **WHEN** balance data is available
- **THEN** the dashboard shows a prominent balance summary with wallet context and status information

### Requirement: Overview presents per-currency balance cards

The system SHALL present the customer's balances by currency as distinct visual summaries rather than a raw unstructured payload.

#### Scenario: Customer has multiple currencies

- **WHEN** the active wallet contains balances in more than one currency
- **THEN** the dashboard shows a separate currency summary for each balance row

### Requirement: Overview presents KPI-style money insights

The system SHALL present compact KPI summaries for customer-visible money activity such as available balance, pending funds, inflow, or outflow so the overview feels like a working financial product rather than a static status page.

#### Scenario: Customer views overview insight cards

- **WHEN** the overview dashboard loads
- **THEN** the customer sees a row of compact financial insight cards with labeled values

### Requirement: Financial overview handles missing balance data gracefully

The system SHALL preserve the dashboard layout when balance data is unavailable and SHALL present a local-development-safe empty or degraded state instead of collapsing the page.

#### Scenario: Balance endpoint is unavailable

- **WHEN** the dashboard cannot retrieve balance data
- **THEN** the financial overview area remains visible and shows a clear fallback state
