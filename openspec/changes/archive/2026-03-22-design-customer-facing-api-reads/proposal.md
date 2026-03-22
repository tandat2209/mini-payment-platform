## Why

The project now has a financial data model, but the customer-facing API is still limited to a health check. We need a first real API surface so customers can see balances, transaction activity, statement data, and saved recipients before we add write flows such as payouts and funding actions.

## What Changes

- Define a v1 customer read API for active wallet balances, transaction history, bank statement views, and recipients.
- Define customer-scoped query behavior so every response is limited to the authenticated customer context.
- Define pagination, filtering, and resource-detail contracts for transaction and recipient views.
- Define a statement read model that exposes statement periods and statement detail without introducing document-generation jobs yet.
- Define a simple clean architecture for the NestJS API using feature modules, application query services, repository ports, and infrastructure adapters.

## Capabilities

### New Capabilities

- `customer-balance-api`: Let a customer view the balances for their active wallet across supported currencies.
- `customer-transaction-history-api`: Let a customer browse and inspect their user-visible transaction history.
- `customer-bank-statement-api`: Let a customer view available statement periods and statement detail derived from customer-visible transactions.
- `customer-recipient-api`: Let a customer view saved recipients and their payout rail summaries.

### Modified Capabilities

- None.

## Impact

- Affects `/Users/datnguyen/Projects/mini-payment-platform/apps/api` module structure, controller contracts, and database-backed query services.
- Builds on `/Users/datnguyen/Projects/mini-payment-platform/packages/db` tables for wallets, balances, user transactions, payouts, recipients, and recipient rails.
- Establishes the first customer-facing read API contract for the future web application.
- Introduces shared patterns for customer scoping, pagination, response DTOs, and error handling that later customer API changes can reuse.
