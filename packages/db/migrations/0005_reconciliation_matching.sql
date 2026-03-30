CREATE TYPE reconciliation_line_outcome AS ENUM (
  'matched',
  'timing_difference',
  'status_mismatch',
  'amount_mismatch',
  'provider_only',
  'internal_only',
  'duplicate_provider_line',
  'unsupported_report_line'
);

CREATE TYPE reconciliation_exception_status AS ENUM ('open', 'resolved');
CREATE TYPE reconciliation_exception_severity AS ENUM ('high', 'medium');

ALTER TABLE reconciliation_report_lines
  ADD COLUMN reconciliation_outcome reconciliation_line_outcome,
  ADD COLUMN outcome_summary TEXT,
  ADD COLUMN matched_webhook_event_id UUID REFERENCES webhook_events(id) ON DELETE SET NULL,
  ADD COLUMN matched_user_transaction_id UUID REFERENCES user_transactions(id) ON DELETE SET NULL,
  ADD COLUMN matched_payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,
  ADD COLUMN matched_payout_attempt_id UUID REFERENCES payout_attempts(id) ON DELETE SET NULL,
  ADD COLUMN matched_ledger_transaction_id UUID REFERENCES ledger_transactions(id) ON DELETE SET NULL,
  ADD COLUMN classified_at TIMESTAMPTZ;

CREATE INDEX reconciliation_report_lines_outcome_idx
  ON reconciliation_report_lines(reconciliation_outcome, classified_at DESC);

CREATE TABLE reconciliation_exceptions (
  id UUID PRIMARY KEY,
  report_batch_id UUID REFERENCES reconciliation_report_batches(id) ON DELETE SET NULL,
  report_line_id UUID UNIQUE REFERENCES reconciliation_report_lines(id) ON DELETE SET NULL,
  outcome reconciliation_line_outcome NOT NULL,
  status reconciliation_exception_status NOT NULL DEFAULT 'open',
  severity reconciliation_exception_severity NOT NULL,
  summary TEXT NOT NULL,
  linked_webhook_event_id UUID REFERENCES webhook_events(id) ON DELETE SET NULL,
  linked_user_transaction_id UUID REFERENCES user_transactions(id) ON DELETE SET NULL,
  linked_payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,
  linked_payout_attempt_id UUID REFERENCES payout_attempts(id) ON DELETE SET NULL,
  linked_ledger_transaction_id UUID REFERENCES ledger_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX reconciliation_exceptions_status_idx
  ON reconciliation_exceptions(status, created_at DESC);

CREATE INDEX reconciliation_exceptions_outcome_idx
  ON reconciliation_exceptions(outcome, created_at DESC);
