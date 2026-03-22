# Customer API Reads

This document describes how to exercise the customer-facing read API against the deterministic seed data.

## Prerequisites

1. Start PostgreSQL:

```bash
pnpm db:up
```

2. Apply the schema and seed data:

```bash
pnpm db:setup
```

3. Start the API:

```bash
pnpm dev:api
```

The API listens on `http://localhost:3001` by default.

## Temporary Customer Identity

The current customer-facing endpoints use a temporary header-backed identity boundary until real authentication is added.

Use either:

- `x-customer-id`
- `x-customer-external-ref`

For the seeded records, the easiest option is:

- Alice: `x-customer-external-ref: user_demo_alice`
- Bob: `x-customer-external-ref: user_demo_bob`

## Example Requests

### View balances

```bash
curl -s http://localhost:3001/customers/me/balances \
  -H 'x-customer-external-ref: user_demo_alice'
```

### View transactions

```bash
curl -s 'http://localhost:3001/customers/me/transactions?limit=20' \
  -H 'x-customer-external-ref: user_demo_alice'
```

### View transaction detail

```bash
curl -s http://localhost:3001/customers/me/transactions/12121212-1212-1212-1212-121212121212 \
  -H 'x-customer-external-ref: user_demo_alice'
```

### View available statements

```bash
curl -s http://localhost:3001/customers/me/statements \
  -H 'x-customer-external-ref: user_demo_alice'
```

### View statement detail

```bash
curl -s http://localhost:3001/customers/me/statements/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2/USD/2026/3 \
  -H 'x-customer-external-ref: user_demo_alice'
```

### View recipients

```bash
curl -s http://localhost:3001/customers/me/recipients \
  -H 'x-customer-external-ref: user_demo_alice'
```

### View recipient detail

```bash
curl -s http://localhost:3001/customers/me/recipients/cccccccc-cccc-cccc-cccc-ccccccccccc1 \
  -H 'x-customer-external-ref: user_demo_alice'
```

## Expected Seed Highlights

- Alice has an active wallet with `USD` and `EUR` balances.
- Alice has one saved recipient with active rails.
- Alice has seeded funding and payout transaction history.
- Alice has a March 2026 USD statement period derived from the seeded transactions.
