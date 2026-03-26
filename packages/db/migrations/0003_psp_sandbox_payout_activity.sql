CREATE TABLE psp_sandbox_payouts (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'psp_sandbox',
  external_request_id TEXT NOT NULL UNIQUE,
  external_payout_id TEXT NOT NULL UNIQUE,
  payout_reference TEXT NOT NULL,
  amount_minor BIGINT NOT NULL,
  currency CHAR(3) NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_country_code CHAR(2) NOT NULL,
  rail TEXT NOT NULL,
  submission_mode TEXT NOT NULL,
  beneficiary_id TEXT,
  destination_details JSONB,
  current_status payout_attempt_status NOT NULL DEFAULT 'accepted',
  simulated_final_status TEXT NOT NULL,
  callback_mode TEXT NOT NULL DEFAULT 'manual',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT psp_sandbox_payouts_amount_positive CHECK (amount_minor > 0),
  CONSTRAINT psp_sandbox_payouts_currency_uppercase CHECK (currency = UPPER(currency)),
  CONSTRAINT psp_sandbox_payouts_country_uppercase
    CHECK (recipient_country_code = UPPER(recipient_country_code)),
  CONSTRAINT psp_sandbox_payouts_destination_details_object
    CHECK (destination_details IS NULL OR jsonb_typeof(destination_details) = 'object'),
  CONSTRAINT psp_sandbox_payouts_metadata_object
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT psp_sandbox_payouts_simulated_final_status_valid
    CHECK (simulated_final_status IN ('paid', 'failed')),
  CONSTRAINT psp_sandbox_payouts_callback_mode_valid
    CHECK (callback_mode IN ('manual')),
  CONSTRAINT psp_sandbox_payouts_submission_mode_valid
    CHECK (submission_mode IN ('inline_details', 'provider_beneficiary')),
  CONSTRAINT psp_sandbox_payouts_submission_target_consistency
    CHECK (
      (
        submission_mode = 'inline_details'
        AND destination_details IS NOT NULL
        AND beneficiary_id IS NULL
      )
      OR (
        submission_mode = 'provider_beneficiary'
        AND beneficiary_id IS NOT NULL
        AND destination_details IS NULL
      )
    )
);

CREATE INDEX psp_sandbox_payouts_reference_idx
  ON psp_sandbox_payouts(payout_reference);

CREATE INDEX psp_sandbox_payouts_status_idx
  ON psp_sandbox_payouts(current_status, updated_at DESC);

CREATE TABLE psp_sandbox_events (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'psp_sandbox',
  aggregate_type TEXT NOT NULL,
  aggregate_external_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_event_id TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT psp_sandbox_events_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX psp_sandbox_events_aggregate_idx
  ON psp_sandbox_events(aggregate_type, aggregate_external_id, occurred_at DESC);

COMMENT ON TABLE psp_sandbox_payouts IS 'Provider-side payout activity stored by the PSP sandbox for callbacks and later report simulation.';
COMMENT ON TABLE psp_sandbox_events IS 'Provider-side event history stored by the PSP sandbox for callbacks, replay, and future reporting.';
