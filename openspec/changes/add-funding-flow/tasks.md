## 1. Customer Funding Details Read Surface

- [x] 1.1 Add the customer funding-details query, repository contract, SQL implementation, and controller response in `apps/api` for the active wallet.
- [x] 1.2 Add API-level coverage for active-wallet retrieval, empty funding-details results, no-active-wallet behavior, and customer scoping.
- [x] 1.3 Add web client types, fetch helpers, and query hooks for the customer funding-details endpoint.

## 2. Inbound Funding Processing In The API

- [x] 2.1 Add a provider webhook endpoint and request contract that records raw funding webhook deliveries in `webhook_events`.
- [x] 2.2 Implement the transactional funding processor that resolves the funding target, creates or updates the wallet balance row, and records webhook processing status.
- [x] 2.3 Implement customer-visible funding transaction creation and balanced ledger posting, including lazy provisioning of required wallet/platform ledger accounts for the funded currency.
- [x] 2.4 Add automated coverage for first-time funding, duplicate provider event replay, invalid funding targets, and funding into a currency without an existing balance row.

## 3. Simulator Trigger And Web Add Money Experience

- [x] 3.1 Implement the simulator funding trigger endpoint and environment-driven outbound delivery to the API webhook endpoint.
- [x] 3.2 Support explicit or generated provider event identifiers in the simulator response so duplicate-delivery testing is possible.
- [x] 3.3 Wire the web `Add money` action to load and display funding details for the current account with loading, empty, and error states.

## 4. End-To-End Verification

- [ ] 4.1 Verify that a simulated funding event results in updated wallet balances, customer transaction history, webhook records, and ledger postings in the local environment.
- [ ] 4.2 Verify that replaying the same simulator event does not create duplicate balance, transaction, or ledger side effects.
- [x] 4.3 Document the local funding flow for opening `Add money`, triggering simulator funding, and checking the resulting account updates.
