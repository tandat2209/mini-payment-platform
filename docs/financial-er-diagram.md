# Financial ER Diagram

This document captures the current v1 database design direction for the payment platform domain.

It is intended as a working reference for:

- wallet and balance modeling
- user-facing transaction history and statements
- payout and recipient relationships
- provider webhook and idempotency handling
- provider reconciliation report ingestion and storage
- double-entry ledger design

## ER Diagram

```mermaid
erDiagram
    USERS ||--o{ WALLETS : owns
    WALLETS ||--o{ WALLET_BALANCES : has
    WALLETS ||--o{ WALLET_FUNDING_DETAILS : supports
    USERS ||--o{ USER_TRANSACTIONS : sees
    WALLETS ||--o{ USER_TRANSACTIONS : records

    USERS ||--o{ RECIPIENTS : manages
    RECIPIENTS ||--o{ RECIPIENT_RAILS : has

    USERS ||--o{ PAYOUTS : initiates
    WALLETS ||--o{ PAYOUTS : funds
    RECIPIENTS ||--o{ PAYOUTS : targets
    RECIPIENT_RAILS ||--o{ PAYOUTS : uses
    PAYOUTS ||--o{ PAYOUT_ATTEMPTS : retries
    PAYOUTS ||--o{ USER_TRANSACTIONS : links_return_credits

    WEBHOOK_EVENTS ||--o{ PAYOUTS : updates
    WEBHOOK_EVENTS ||--o{ USER_TRANSACTIONS : explains
    WEBHOOK_EVENTS ||--o{ LEDGER_TRANSACTIONS : triggers
    WEBHOOK_EVENTS ||--o| RECONCILIATION_REPORT_BATCHES : envelopes

    IDEMPOTENCY_KEYS ||--o{ PAYOUTS : protects
    IDEMPOTENCY_KEYS ||--o{ PAYOUT_ATTEMPTS : reuses

    RECONCILIATION_REPORT_BATCHES ||--o{ RECONCILIATION_REPORT_LINES : contains
    WALLETS ||--o{ RECONCILIATION_REPORT_LINES : provides_wallet_context
    PAYOUTS ||--o{ RECONCILIATION_REPORT_LINES : reported_as_payout_or_return

    WALLETS ||--o{ LEDGER_ACCOUNTS : owns_wallet_account
    RECIPIENTS ||--o{ LEDGER_ACCOUNTS : owns_payable_account
    LEDGER_ACCOUNTS ||--o{ LEDGER_ENTRIES : posts_to
    LEDGER_TRANSACTIONS ||--o{ LEDGER_ENTRIES : contains

    USER_TRANSACTIONS ||--o| PAYOUTS : represents
    USER_TRANSACTIONS ||--o| LEDGER_TRANSACTIONS : references

    USERS {
        uuid id PK
        string external_ref
        datetime created_at
    }

    WALLETS {
        uuid id PK
        uuid user_id FK
        string status
        datetime opened_at
        datetime closed_at
    }

    WALLET_BALANCES {
        uuid id PK
        uuid wallet_id FK
        string currency
        bigint available_amount_minor
        bigint pending_amount_minor
        datetime updated_at
    }

    WALLET_FUNDING_DETAILS {
        uuid id PK
        uuid wallet_id FK
        string rail
        string currency
        jsonb details
        boolean is_active
    }

    USER_TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid wallet_id FK
        uuid webhook_event_id FK
        string type
        string direction
        string status
        string currency
        bigint gross_amount_minor
        bigint fee_amount_minor
        bigint net_amount_minor
        string description
        string reference
        datetime occurred_at
        datetime posted_at
        uuid related_payout_id FK
    }

    RECIPIENTS {
        uuid id PK
        uuid user_id FK
        string name
        string status
        datetime created_at
        datetime updated_at
    }

    RECIPIENT_RAILS {
        uuid id PK
        uuid recipient_id FK
        string rail
        string currency
        string country_code
        jsonb details
        string readiness_status
        string provider_registration_strategy
        string provider_reference
        string provider_registration_error
        datetime provider_registered_at
        boolean is_default
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    PAYOUTS {
        uuid id PK
        uuid user_id FK
        uuid wallet_id FK
        uuid recipient_id FK
        uuid recipient_rail_id FK
        uuid user_transaction_id FK
        uuid idempotency_key_id FK
        string rail
        string status
        string currency
        bigint gross_amount_minor
        bigint fee_amount_minor
        bigint net_amount_minor
        string reference
        datetime created_at
        datetime updated_at
        datetime submitted_at
        datetime completed_at
        datetime failed_at
        datetime returned_at
        bigint returned_amount_minor
    }

    PAYOUT_ATTEMPTS {
        uuid id PK
        uuid payout_id FK
        uuid idempotency_key_id FK
        string provider
        string external_request_id
        string external_payout_id
        string status
        jsonb request_payload
        jsonb response_payload
        datetime submitted_at
        datetime resolved_at
    }

    WEBHOOK_EVENTS {
        uuid id PK
        string provider
        string external_event_id
        string event_type
        string processing_status
        boolean signature_verified
        jsonb payload
        datetime received_at
        datetime processed_at
        datetime created_at
    }

    IDEMPOTENCY_KEYS {
        uuid id PK
        string scope
        string key
        string status
        string request_fingerprint
        jsonb response_payload
        datetime created_at
        datetime updated_at
    }

    LEDGER_ACCOUNTS {
        uuid id PK
        string code
        string name
        string account_type
        string owner_type
        uuid owner_id
        string currency
        string status
        jsonb metadata
        datetime created_at
        datetime updated_at
    }

    LEDGER_TRANSACTIONS {
        uuid id PK
        uuid user_transaction_id FK
        string transaction_type
        string status
        string currency
        string reference
        uuid webhook_event_id FK
        string description
        datetime created_at
        datetime posted_at
        datetime reversed_at
    }

    LEDGER_ENTRIES {
        uuid id PK
        uuid ledger_transaction_id FK
        uuid ledger_account_id FK
        string direction
        string currency
        bigint amount_minor
        datetime created_at
    }

    RECONCILIATION_REPORT_BATCHES {
        uuid id PK
        uuid webhook_event_id FK
        string provider
        string provider_report_id
        date report_date
        datetime report_window_start
        datetime report_window_end
        int line_count
        string processing_status
        jsonb raw_payload
        datetime received_at
        datetime processed_at
        datetime created_at
        datetime updated_at
    }

    RECONCILIATION_REPORT_LINES {
        uuid id PK
        uuid batch_id FK
        int line_index
        string provider_line_id
        string line_type
        string line_status
        string currency
        bigint gross_amount_minor
        bigint fee_amount_minor
        bigint net_amount_minor
        bigint returned_amount_minor
        string external_event_id
        string external_payout_id
        string external_request_id
        string provider_reference
        string internal_reference
        string customer_external_ref
        uuid wallet_id
        datetime event_timestamp
        string processing_status
        jsonb raw_payload
        datetime processed_at
        datetime created_at
        datetime updated_at
    }
```

## Notes

- `user_transactions` is the source for user-facing history and statements.
- `ledger_transactions` and `ledger_entries` are the internal financial source of truth.
- `payouts` represents the business payout object.
- `payout_attempts` stores PSP execution and retry history.
- returned payouts stay attached to the original `payouts` row through `status`, `returned_at`, and `returned_amount_minor`.
- `user_transactions.related_payout_id` links return-credit transactions back to the original payout they compensate.
- `webhook_events` stores raw provider callbacks for deduplication, replay, and auditability.
- `reconciliation_report_batches` stores each provider report delivery as its own durable batch envelope.
- `reconciliation_report_lines` stores normalized provider observations for funding, payout, and return lines before reconciliation matching/classification.
- reconciliation report lines intentionally keep provider identifiers and wallet context without hard foreign keys to payouts or user transactions, because they may arrive before internal matching is resolved.
- `ledger_accounts` currently uses a generic ownership model with `owner_type` and `owner_id`.
- In practice, wallet liability accounts point at wallets, recipient payable accounts point at recipients, and platform accounts have no domain owner row.
- `wallet_balances` is a balance read model and must stay consistent with ledger posting.
- `recipient_rails` now carries onboarding readiness and provider-registration strategy per rail, so one recipient can have multiple payout methods in different lifecycle states.
- The current onboarding foundation uses a hybrid recipient strategy:
  - `platform_managed` rails store validated details and can be embedded later at payout submission time.
  - `provider_managed` rails are expected to register a beneficiary or transfer instrument with the PSP before they become payout-ready.

## Status

This is a working design reference and may evolve as the `design-financial-database-foundation` change is implemented.
