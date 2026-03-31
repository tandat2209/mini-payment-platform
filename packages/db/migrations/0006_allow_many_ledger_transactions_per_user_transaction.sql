ALTER TABLE ledger_transactions
  DROP CONSTRAINT IF EXISTS ledger_transactions_user_transaction_id_key;

CREATE INDEX IF NOT EXISTS ledger_transactions_user_transaction_idx
  ON ledger_transactions(user_transaction_id)
  WHERE user_transaction_id IS NOT NULL;

UPDATE ledger_transactions lt
SET user_transaction_id = p.user_transaction_id
FROM payouts p
WHERE lt.user_transaction_id IS NULL
  AND lt.reference = p.reference
  AND lt.currency = p.currency
  AND (
    (lt.transaction_type = 'payout_settlement' AND p.status IN ('paid', 'returned'))
    OR (lt.transaction_type = 'reversal' AND p.status = 'failed')
  );
