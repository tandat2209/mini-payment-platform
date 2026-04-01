## 1. PSP Sandbox Return Simulation

- [x] 1.1 Define the PSP sandbox payout return event payload and delivery contract for previously paid payouts.
- [x] 1.2 Add PSP sandbox support for triggering deterministic payout return events tied to existing provider payout identifiers.
- [x] 1.3 Add automated coverage for payout return event emission and duplicate return-event replay.

## 2. API Return Ingestion And Payout State Handling

- [x] 2.1 Add API-side payout return event ingestion, deduplication, and provider-to-payout-attempt resolution.
- [x] 2.2 Extend payout lifecycle handling so previously paid payouts transition to `returned` using explicit returned-amount fields.
- [x] 2.3 Add automated coverage for successful payout-return ingestion and idempotent replay behavior.

## 3. Ledger, Wallet, And Transaction Effects

- [x] 3.1 Implement append-only post-settlement ledger postings for returned payouts using the actual returned amount and full fee reversal.
- [x] 3.2 Implement wallet restoration behavior for returned payouts according to the actual returned amount rather than assuming the original gross is restored.
- [x] 3.3 Update customer transaction state handling so the original payout debit keeps a returned-style terminal status and a separate linked return credit transaction records the money coming back.
- [x] 3.4 Add automated coverage for ledger, wallet, and customer transaction effects of returned payouts.

## 4. Customer And Admin Visibility

- [x] 4.1 Update customer payout and transaction reads to surface returned payouts clearly.
- [x] 4.2 Update admin payout, webhook, and investigation reads to expose returned payout context and cross-links.
- [x] 4.3 Verify locally that a payout can progress from paid to returned with matching provider event, payout state, wallet effect, and ledger records.
- [x] 4.4 Document the local payout-return workflow across PSP sandbox, API, customer app, and admin app.
