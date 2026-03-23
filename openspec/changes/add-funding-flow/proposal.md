## Why

The web app now exposes an `Add money` action, but there is no customer funding journey behind it and no executable way to demonstrate money entering a wallet. We need an end-to-end funding flow so the product can show funding instructions on the web, simulate inbound provider activity locally, and prove that balance, transaction, and ledger records move together when money arrives.

## What Changes

- Add a customer-facing funding details API that returns the active wallet funding instructions for the current account.
- Add an `Add money` web flow that reveals funding details for the account from the existing dashboard experience.
- Add a simulator API endpoint that can trigger deterministic inbound funding webhook events for local development and demos.
- Add API-side webhook ingestion and funding processing that stores raw events, deduplicates provider event deliveries, updates wallet balances, creates customer transaction history, and posts ledger entries atomically.
- Add verification coverage for the funding path so local development can prove the webhook-to-balance pipeline works end to end.

## Capabilities

### New Capabilities

- `customer-funding-details-api`: Read the active funding instructions for the current customer wallet so the web app can display how to add money.
- `customer-add-money-ui`: Let the customer open the `Add money` flow from the dashboard and view the funding details tied to the account.
- `simulator-funding-events-api`: Trigger demo inbound funding events with controlled amounts, currencies, and wallet targets for local testing.

### Modified Capabilities

- `provider-integration-and-reconciliation`: Expand provider webhook handling from schema-only readiness to executable inbound funding event ingestion, deduplication, and processing status tracking.
- `wallets`: Require successful funding processing to increase the targeted wallet balance for the funding currency while preserving active-wallet ownership rules.
- `ledger`: Require successful funding processing to create balanced ledger postings linked to the inbound webhook and wallet update.
- `user-transactions-and-statements`: Require successful funding processing to create customer-visible funding transactions suitable for transaction history and statements.

## Impact

- Affected code: `apps/web`, `apps/api`, `apps/simulator`, and database-backed repositories/services that read funding details and process funding events.
- Affected APIs: new customer funding details read endpoint, new simulator trigger endpoint, and new or expanded webhook ingestion endpoint in the API application.
- Affected systems: wallet balances, `webhook_events`, `user_transactions`, and ledger posting flows.
- Dependencies: existing Postgres schema and seeded wallet funding details; no new external providers are required because the simulator will drive the demo flow.
