## 1. Admin API Surfaces

- [x] 1.1 Add admin API routes and DTOs for triggering simulator funding requests through `apps/api`.
- [x] 1.2 Add admin API routes and query/repository support for listing platform-wide user transactions with filters and pagination.
- [x] 1.3 Add admin API routes and query/repository support for transaction detail, ledger transaction list, and ledger entry detail views.
- [ ] 1.4 Add API-level coverage for admin simulator invocation, admin transaction reads, and admin ledger reads.

## 2. Admin Web Experience

- [x] 2.1 Add an admin section to the web app navigation and route structure with dedicated pages.
- [x] 2.2 Build the admin simulator form and result panel that calls the admin simulator endpoint with provider-style funding inputs.
- [x] 2.3 Build the admin transactions page with filters, list/detail behavior, and platform-wide transaction visibility.
- [x] 2.4 Build the admin ledger page with ledger transaction list and selected-entry detail inspection.

## 3. Integration And Verification

- [x] 3.1 Connect the admin web pages to the new admin APIs with loading, empty, and error states.
- [ ] 3.2 Verify that an admin-triggered simulator funding event appears in admin transactions and the ledger view after processing.
- [ ] 3.3 Document the local admin workflow for opening the admin area, triggering simulator funding, and inspecting resulting transaction and ledger records.
