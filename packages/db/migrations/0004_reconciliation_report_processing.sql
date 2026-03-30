CREATE TABLE reconciliation_report_batches (
  id UUID PRIMARY KEY,
  webhook_event_id UUID NOT NULL UNIQUE REFERENCES webhook_events(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL,
  provider_report_id TEXT NOT NULL,
  report_date DATE NOT NULL,
  report_window_start TIMESTAMPTZ NOT NULL,
  report_window_end TIMESTAMPTZ NOT NULL,
  line_count INTEGER NOT NULL,
  processing_status webhook_processing_status NOT NULL DEFAULT 'received',
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reconciliation_report_batches_line_count_nonnegative CHECK (line_count >= 0),
  CONSTRAINT reconciliation_report_batches_raw_payload_object
    CHECK (jsonb_typeof(raw_payload) = 'object')
);

CREATE UNIQUE INDEX reconciliation_report_batches_provider_report_id_key
  ON reconciliation_report_batches(provider, provider_report_id);

CREATE TABLE reconciliation_report_lines (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES reconciliation_report_batches(id) ON DELETE CASCADE,
  line_index INTEGER NOT NULL,
  provider_line_id TEXT NOT NULL,
  line_type TEXT NOT NULL,
  line_status TEXT NOT NULL,
  currency CHAR(3) NOT NULL,
  gross_amount_minor BIGINT NOT NULL,
  fee_amount_minor BIGINT NOT NULL DEFAULT 0,
  net_amount_minor BIGINT NOT NULL,
  returned_amount_minor BIGINT,
  external_event_id TEXT,
  external_payout_id TEXT,
  external_request_id TEXT,
  provider_reference TEXT,
  internal_reference TEXT,
  customer_external_ref TEXT,
  wallet_id UUID,
  event_timestamp TIMESTAMPTZ NOT NULL,
  processing_status webhook_processing_status NOT NULL DEFAULT 'received',
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reconciliation_report_lines_currency_uppercase CHECK (currency = UPPER(currency)),
  CONSTRAINT reconciliation_report_lines_line_index_nonnegative CHECK (line_index >= 0),
  CONSTRAINT reconciliation_report_lines_gross_nonnegative CHECK (gross_amount_minor >= 0),
  CONSTRAINT reconciliation_report_lines_fee_nonnegative CHECK (fee_amount_minor >= 0),
  CONSTRAINT reconciliation_report_lines_net_nonnegative CHECK (net_amount_minor >= 0),
  CONSTRAINT reconciliation_report_lines_returned_nonnegative
    CHECK (returned_amount_minor IS NULL OR returned_amount_minor >= 0),
  CONSTRAINT reconciliation_report_lines_raw_payload_object
    CHECK (jsonb_typeof(raw_payload) = 'object')
);

CREATE UNIQUE INDEX reconciliation_report_lines_batch_line_index_key
  ON reconciliation_report_lines(batch_id, line_index);

CREATE UNIQUE INDEX reconciliation_report_lines_batch_provider_line_id_key
  ON reconciliation_report_lines(batch_id, provider_line_id);
