# Payout Return Workflow

This document describes the first-slice local workflow for a payout that is paid first and then
returned later by the PSP sandbox.

## Preconditions

- Local services are running:
  - API: `http://localhost:3001`
  - Web: `http://localhost:5173`
  - PSP Sandbox: `http://localhost:3002`
- Local database is migrated and seeded:

```bash
pnpm db:setup
```

## Flow Summary

1. Customer creates a payout from the web app.
2. API books the payout and submits it to the PSP sandbox.
3. PSP sandbox simulates `paid`.
4. API marks the payout `paid` and settles the payable.
5. PSP sandbox later simulates `payout.returned`.
6. API marks the payout `returned`, reverses fee revenue, restores wallet funds, and records a
   separate return credit transaction.

## 1. Create A Payout

1. Open `http://localhost:5173`.
2. Create a payout from the customer app using any payout-ready recipient.
3. Wait until the payout moves from `Submitted` to `Processing` or `Paid`.

You can also capture the created customer transaction id from the network response if you want to
inspect it through the customer or admin transaction detail endpoints.

## 2. Simulate A Paid Callback

Use the PSP sandbox payout update tool in the web app, or call the sandbox directly:

```bash
curl -X POST http://localhost:3002/simulate/payout-updates \
  -H 'content-type: application/json' \
  -d '{
    "externalPayoutId": "ppay_test_001",
    "status": "paid"
  }'
```

Expected result:

- payout status becomes `paid`
- original payout transaction becomes `completed`
- settlement ledger entry is recorded

## 3. Simulate A Return Callback

Trigger the dedicated PSP sandbox return event:

```bash
curl -X POST http://localhost:3002/simulate/payout-returns \
  -H 'content-type: application/json' \
  -d '{
    "externalPayoutId": "ppay_test_001",
    "returnedAmountMinor": 2503,
    "returnReason": "destination_bank_returned"
  }'
```

Expected API-side result:

- payout status becomes `returned`
- original payout debit transaction keeps its history row and moves to `returned`
- a separate linked return credit transaction is created
- wallet available balance is restored by the provider return amount plus the fully reversed fee
- return reversal ledger entry is recorded

## 4. Customer App Checks

In the customer app:

- the payout status screen should show `Returned`
- the original payout transaction detail should show the returned payout context
- a separate credit transaction should appear for the returned funds

## 5. Admin App Checks

In the admin app:

- `Payouts` should show the payout as `Returned`
- payout detail should show:
  - provider return amount
  - wallet credit amount
  - linked webhook id
- `Transactions` should show:
  - the original payout debit in `Returned`
  - the linked return credit transaction
- `Webhooks` should show the `payout.returned` provider event
- `Ledger` should show the append-only return reversal posting

## 6. Accounting Expectations

For the first slice, returned payouts reverse fees in full.

When a payout return is processed:

- `Platform Cash` is reduced by the provider-returned amount
- `Platform Revenue` is debited by the full payout fee
- `Wallet Liabilities` is credited by the total wallet restoration amount

The customer-visible return credit therefore reflects:

```text
provider returned amount + reversed fee
```

This keeps the customer wallet, payout state, and append-only ledger aligned for the first return
slice.
