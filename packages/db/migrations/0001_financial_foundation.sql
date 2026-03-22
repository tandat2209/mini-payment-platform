CREATE TYPE wallet_status AS ENUM ('active', 'closed');
CREATE TYPE user_transaction_type AS ENUM ('funding', 'payout', 'adjustment', 'reversal');
CREATE TYPE transaction_direction AS ENUM ('credit', 'debit');
CREATE TYPE user_transaction_status AS ENUM ('pending', 'posted', 'completed', 'failed', 'reversed');
CREATE TYPE recipient_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE payout_status AS ENUM ('pending_submission', 'submitted', 'processing', 'paid', 'failed', 'reversed', 'cancelled');
CREATE TYPE payout_attempt_status AS ENUM ('submitted', 'accepted', 'processing', 'succeeded', 'failed', 'unknown');
CREATE TYPE webhook_processing_status AS ENUM ('received', 'processed', 'failed', 'ignored');
CREATE TYPE idempotency_status AS ENUM ('created', 'completed', 'failed');
CREATE TYPE ledger_account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
CREATE TYPE ledger_account_status AS ENUM ('open', 'closed');
CREATE TYPE ledger_transaction_type AS ENUM ('funding', 'payout', 'payout_settlement', 'adjustment', 'reversal');
CREATE TYPE ledger_transaction_status AS ENUM ('pending', 'posted', 'reversed');
CREATE TYPE ledger_entry_direction AS ENUM ('debit', 'credit');

CREATE TABLE users (
  id UUID PRIMARY KEY,
  external_ref TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  processing_status webhook_processing_status NOT NULL DEFAULT 'received',
  signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT webhook_events_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

CREATE UNIQUE INDEX webhook_events_provider_event_id_key
  ON webhook_events(provider, external_event_id);

CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY,
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  status idempotency_status NOT NULL DEFAULT 'created',
  request_fingerprint TEXT,
  response_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT idempotency_keys_response_payload_object
    CHECK (response_payload IS NULL OR jsonb_typeof(response_payload) = 'object')
);

CREATE UNIQUE INDEX idempotency_keys_scope_key_key
  ON idempotency_keys(scope, key);

CREATE TABLE wallets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status wallet_status NOT NULL DEFAULT 'active',
  label TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wallets_closed_at_required
    CHECK ((status = 'closed' AND closed_at IS NOT NULL) OR (status = 'active' AND closed_at IS NULL))
);

CREATE UNIQUE INDEX wallets_one_active_wallet_per_user
  ON wallets(user_id)
  WHERE status = 'active';

CREATE TABLE wallet_balances (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  currency CHAR(3) NOT NULL,
  available_amount_minor BIGINT NOT NULL DEFAULT 0,
  pending_amount_minor BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wallet_balances_available_nonnegative CHECK (available_amount_minor >= 0),
  CONSTRAINT wallet_balances_pending_nonnegative CHECK (pending_amount_minor >= 0),
  CONSTRAINT wallet_balances_currency_uppercase CHECK (currency = UPPER(currency))
);

CREATE UNIQUE INDEX wallet_balances_wallet_currency_key
  ON wallet_balances(wallet_id, currency);

CREATE TABLE wallet_funding_details (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  rail TEXT NOT NULL,
  currency CHAR(3),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wallet_funding_details_details_object CHECK (jsonb_typeof(details) = 'object'),
  CONSTRAINT wallet_funding_details_currency_uppercase
    CHECK (currency IS NULL OR currency = UPPER(currency))
);

CREATE INDEX wallet_funding_details_wallet_id_idx
  ON wallet_funding_details(wallet_id);

CREATE TABLE recipients (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  status recipient_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX recipients_user_id_idx
  ON recipients(user_id);

CREATE TABLE recipient_rails (
  id UUID PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  rail TEXT NOT NULL,
  currency CHAR(3),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recipient_rails_details_object CHECK (jsonb_typeof(details) = 'object'),
  CONSTRAINT recipient_rails_currency_uppercase CHECK (currency IS NULL OR currency = UPPER(currency))
);

CREATE INDEX recipient_rails_recipient_id_idx
  ON recipient_rails(recipient_id);

CREATE UNIQUE INDEX recipient_rails_default_per_recipient_rail
  ON recipient_rails(recipient_id, rail)
  WHERE is_default = TRUE AND is_active = TRUE;

CREATE TABLE user_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  webhook_event_id UUID REFERENCES webhook_events(id) ON DELETE SET NULL,
  type user_transaction_type NOT NULL,
  direction transaction_direction NOT NULL,
  status user_transaction_status NOT NULL,
  currency CHAR(3) NOT NULL,
  gross_amount_minor BIGINT NOT NULL,
  fee_amount_minor BIGINT NOT NULL DEFAULT 0,
  net_amount_minor BIGINT NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_transactions_currency_uppercase CHECK (currency = UPPER(currency)),
  CONSTRAINT user_transactions_gross_positive CHECK (gross_amount_minor > 0),
  CONSTRAINT user_transactions_fee_nonnegative CHECK (fee_amount_minor >= 0),
  CONSTRAINT user_transactions_net_nonnegative CHECK (net_amount_minor >= 0),
  CONSTRAINT user_transactions_amount_consistency CHECK (gross_amount_minor = fee_amount_minor + net_amount_minor)
);

CREATE INDEX user_transactions_user_wallet_occurred_idx
  ON user_transactions(user_id, wallet_id, occurred_at DESC);

CREATE INDEX user_transactions_reference_idx
  ON user_transactions(reference);

CREATE TABLE payouts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE RESTRICT,
  recipient_rail_id UUID NOT NULL REFERENCES recipient_rails(id) ON DELETE RESTRICT,
  user_transaction_id UUID NOT NULL UNIQUE REFERENCES user_transactions(id) ON DELETE RESTRICT,
  idempotency_key_id UUID REFERENCES idempotency_keys(id) ON DELETE SET NULL,
  rail TEXT NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending_submission',
  currency CHAR(3) NOT NULL,
  gross_amount_minor BIGINT NOT NULL,
  fee_amount_minor BIGINT NOT NULL DEFAULT 0,
  net_amount_minor BIGINT NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  CONSTRAINT payouts_currency_uppercase CHECK (currency = UPPER(currency)),
  CONSTRAINT payouts_gross_positive CHECK (gross_amount_minor > 0),
  CONSTRAINT payouts_fee_nonnegative CHECK (fee_amount_minor >= 0),
  CONSTRAINT payouts_net_nonnegative CHECK (net_amount_minor >= 0),
  CONSTRAINT payouts_amount_consistency CHECK (gross_amount_minor = fee_amount_minor + net_amount_minor)
);

CREATE INDEX payouts_user_wallet_created_idx
  ON payouts(user_id, wallet_id, created_at DESC);

CREATE INDEX payouts_status_idx
  ON payouts(status);

CREATE TABLE payout_attempts (
  id UUID PRIMARY KEY,
  payout_id UUID NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  idempotency_key_id UUID REFERENCES idempotency_keys(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  external_request_id TEXT,
  external_payout_id TEXT,
  status payout_attempt_status NOT NULL DEFAULT 'submitted',
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_payload JSONB,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payout_attempts_request_payload_object CHECK (jsonb_typeof(request_payload) = 'object'),
  CONSTRAINT payout_attempts_response_payload_object
    CHECK (response_payload IS NULL OR jsonb_typeof(response_payload) = 'object')
);

CREATE INDEX payout_attempts_payout_id_idx
  ON payout_attempts(payout_id, submitted_at DESC);

CREATE UNIQUE INDEX payout_attempts_provider_request_unique
  ON payout_attempts(provider, external_request_id)
  WHERE external_request_id IS NOT NULL;

CREATE UNIQUE INDEX payout_attempts_provider_payout_unique
  ON payout_attempts(provider, external_payout_id)
  WHERE external_payout_id IS NOT NULL;

CREATE TABLE ledger_accounts (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  account_type ledger_account_type NOT NULL,
  owner_type TEXT,
  owner_id UUID,
  currency CHAR(3) NOT NULL,
  status ledger_account_status NOT NULL DEFAULT 'open',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ledger_accounts_currency_uppercase CHECK (currency = UPPER(currency)),
  CONSTRAINT ledger_accounts_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX ledger_accounts_owner_idx
  ON ledger_accounts(owner_type, owner_id, currency);

CREATE TABLE ledger_transactions (
  id UUID PRIMARY KEY,
  user_transaction_id UUID UNIQUE REFERENCES user_transactions(id) ON DELETE SET NULL,
  webhook_event_id UUID REFERENCES webhook_events(id) ON DELETE SET NULL,
  transaction_type ledger_transaction_type NOT NULL,
  status ledger_transaction_status NOT NULL DEFAULT 'posted',
  currency CHAR(3) NOT NULL,
  reference TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posted_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  CONSTRAINT ledger_transactions_currency_uppercase CHECK (currency = UPPER(currency))
);

CREATE INDEX ledger_transactions_reference_idx
  ON ledger_transactions(reference);

CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY,
  ledger_transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
  ledger_account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
  direction ledger_entry_direction NOT NULL,
  currency CHAR(3) NOT NULL,
  amount_minor BIGINT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ledger_entries_currency_uppercase CHECK (currency = UPPER(currency)),
  CONSTRAINT ledger_entries_amount_positive CHECK (amount_minor > 0)
);

CREATE INDEX ledger_entries_transaction_idx
  ON ledger_entries(ledger_transaction_id);

CREATE INDEX ledger_entries_account_idx
  ON ledger_entries(ledger_account_id, currency);

COMMENT ON TABLE user_transactions IS 'Customer-facing transaction history and statement source.';
COMMENT ON TABLE payouts IS 'Business-level outbound payment instructions.';
COMMENT ON TABLE payout_attempts IS 'Provider execution and retry history for payouts.';
COMMENT ON TABLE webhook_events IS 'Raw PSP webhook evidence for deduplication, replay, and auditability.';
COMMENT ON TABLE ledger_transactions IS 'Accounting transaction containers for double-entry posting.';
COMMENT ON TABLE ledger_entries IS 'Append-only debit and credit lines linked to ledger transactions.';

