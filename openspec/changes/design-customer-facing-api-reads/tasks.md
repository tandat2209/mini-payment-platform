## 1. Shared Customer API Foundation

- [x] 1.1 Add a shared current-customer boundary for the NestJS API so customer-facing queries are resolved from request context instead of arbitrary user parameters.
- [x] 1.2 Add common DTO and response-mapping primitives for money amounts, pagination cursors, timestamps, and customer-facing error responses.
- [x] 1.3 Create the feature-first module scaffolding for balances, transactions, statements, and recipients using controller, application, repository-port, and infrastructure layers.

## 2. Balance And Recipient Read APIs

- [x] 2.1 Implement the balance query repository and application use case that return the active wallet and per-currency balance rows for the current customer.
- [x] 2.2 Implement the customer balance controller and response DTOs, including the no-active-wallet behavior defined by the spec.
- [x] 2.3 Implement the recipient list and recipient detail repositories with ownership filtering and masked rail-detail mapping.
- [x] 2.4 Implement the recipient controller and response DTOs for list and detail views.

## 3. Transaction And Statement Read APIs

- [x] 3.1 Implement the transaction history repository with cursor pagination, filter support, and descending activity ordering.
- [x] 3.2 Implement the transaction detail query and controller response that expose customer-visible transaction fields plus payout or recipient enrichment when available.
- [x] 3.3 Implement the statement period repository that derives available monthly statements for the current customer's active wallet.
- [x] 3.4 Implement the statement detail repository and controller response that calculate opening balance, closing balance, totals, and line items for a requested statement month.

## 4. Verification

- [x] 4.1 Add repository-level tests for ownership scoping, balance lookup, transaction filtering, cursor pagination, and statement calculations.
- [x] 4.2 Add API-level tests that verify the customer cannot access another customer's balances, transactions, statements, or recipients.
- [x] 4.3 Add tests for recipient rail masking and for the statement line-item inclusion rules defined by the spec.
- [x] 4.4 Document local verification steps for exercising the new customer read endpoints against the seeded financial scenario.
