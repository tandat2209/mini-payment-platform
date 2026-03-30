ALTER TYPE payout_status ADD VALUE IF NOT EXISTS 'returned';
ALTER TYPE user_transaction_status ADD VALUE IF NOT EXISTS 'returned';

ALTER TABLE payouts
  ADD COLUMN returned_at TIMESTAMPTZ,
  ADD COLUMN returned_amount_minor BIGINT;

ALTER TABLE user_transactions
  ADD COLUMN related_payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL;

CREATE INDEX user_transactions_related_payout_id_idx
  ON user_transactions(related_payout_id);

ALTER TABLE payouts
  ADD CONSTRAINT payouts_returned_amount_positive
  CHECK (
    returned_amount_minor IS NULL
    OR (returned_amount_minor > 0 AND returned_amount_minor <= gross_amount_minor)
  );

ALTER TABLE payouts
  ADD CONSTRAINT payouts_returned_state_fields
  CHECK (
    (
      status::text = 'returned'
      AND returned_at IS NOT NULL
      AND returned_amount_minor IS NOT NULL
    )
    OR (
      status::text <> 'returned'
      AND returned_at IS NULL
      AND returned_amount_minor IS NULL
    )
  );
