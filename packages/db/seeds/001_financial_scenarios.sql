INSERT INTO users (id, external_ref, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'user_demo_alice', '2026-03-22T00:00:00Z'),
  ('22222222-2222-2222-2222-222222222222', 'user_demo_bob', '2026-03-22T00:05:00Z');

INSERT INTO wallets (id, user_id, status, label, opened_at, closed_at, created_at, updated_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'closed', 'Alice primary wallet v1', '2026-03-22T00:00:00Z', '2026-03-22T00:59:00Z', '2026-03-22T00:00:00Z', '2026-03-22T00:59:00Z'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', 'active', 'Alice primary wallet v2', '2026-03-22T01:00:00Z', NULL, '2026-03-22T01:00:00Z', '2026-03-22T01:00:00Z'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222', 'active', 'Bob primary wallet', '2026-03-22T00:05:00Z', NULL, '2026-03-22T00:05:00Z', '2026-03-22T00:05:00Z');

INSERT INTO wallet_balances (id, wallet_id, currency, available_amount_minor, pending_amount_minor, created_at, updated_at) VALUES
  ('baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'USD', 6800, 0, '2026-03-22T01:10:00Z', '2026-03-22T01:21:20Z'),
  ('baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'EUR', 0, 0, '2026-03-22T01:10:00Z', '2026-03-22T01:10:00Z'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'USD', 0, 0, '2026-03-22T00:10:00Z', '2026-03-22T00:10:00Z');

INSERT INTO wallet_funding_details (id, wallet_id, rail, currency, details, is_active, created_at, updated_at) VALUES
  ('fdaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bank_transfer', 'USD', '{"accountNumber":"1234567890","routingNumber":"021000021"}'::jsonb, TRUE, '2026-03-22T01:00:00Z', '2026-03-22T01:00:00Z'),
  ('fdaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'virtual_iban', 'EUR', '{"iban":"DE89370400440532013000"}'::jsonb, TRUE, '2026-03-22T01:05:00Z', '2026-03-22T01:05:00Z');

INSERT INTO recipients (id, user_id, name, status, created_at, updated_at) VALUES
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', 'Vendor One', 'active', '2026-03-22T01:15:00Z', '2026-03-22T01:15:00Z');

INSERT INTO recipient_rails (
  id,
  recipient_id,
  rail,
  currency,
  country_code,
  details,
  readiness_status,
  provider_registration_strategy,
  provider_reference,
  provider_registered_at,
  is_default,
  is_active,
  created_at,
  updated_at
) VALUES
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'ach',
    'USD',
    'US',
    '{"accountNumber":"9876543210","routingNumber":"011000015"}'::jsonb,
    'active',
    'platform_managed',
    NULL,
    NULL,
    TRUE,
    TRUE,
    '2026-03-22T01:15:00Z',
    '2026-03-22T01:15:00Z'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'swift',
    'USD',
    'GB',
    '{"accountNumber":"111122223333","swiftCode":"BARCGB22"}'::jsonb,
    'active',
    'provider_managed',
    'bene_swift_vendor_one',
    '2026-03-22T01:16:15Z',
    FALSE,
    TRUE,
    '2026-03-22T01:16:00Z',
    '2026-03-22T01:16:15Z'
  );

INSERT INTO webhook_events (id, provider, external_event_id, event_type, processing_status, signature_verified, payload, received_at, processed_at, created_at) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'demo_psp', 'evt_funding_001', 'funding.completed', 'processed', TRUE, '{"walletExternalRef":"user_demo_alice","amountMinor":10000,"currency":"USD"}'::jsonb, '2026-03-22T01:10:00Z', '2026-03-22T01:10:30Z', '2026-03-22T01:10:00Z'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'demo_psp', 'evt_payout_001', 'payout.completed', 'processed', TRUE, '{"payoutExternalId":"po_ext_001","status":"paid"}'::jsonb, '2026-03-22T01:21:00Z', '2026-03-22T01:21:20Z', '2026-03-22T01:21:00Z');

INSERT INTO idempotency_keys (id, scope, key, status, request_fingerprint, response_payload, created_at, updated_at) VALUES
  ('99999999-9999-9999-9999-999999999991', 'payout:create', 'payout-alice-001', 'completed', 'sha256:payout-alice-001', '{"accepted":true}'::jsonb, '2026-03-22T01:20:00Z', '2026-03-22T01:21:00Z');

INSERT INTO user_transactions (id, user_id, wallet_id, webhook_event_id, type, direction, status, currency, gross_amount_minor, fee_amount_minor, net_amount_minor, description, reference, occurred_at, posted_at, created_at, updated_at) VALUES
  ('12121212-1212-1212-1212-121212121211', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'funding', 'credit', 'completed', 'USD', 10000, 0, 10000, 'Funding received from PSP', 'funding-001', '2026-03-22T01:10:30Z', '2026-03-22T01:10:30Z', '2026-03-22T01:10:30Z', '2026-03-22T01:10:30Z'),
  ('12121212-1212-1212-1212-121212121212', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NULL, 'payout', 'debit', 'completed', 'USD', 3200, 3000, 200, 'Payout to Vendor One', 'payout-001', '2026-03-22T01:20:00Z', '2026-03-22T01:21:20Z', '2026-03-22T01:20:00Z', '2026-03-22T01:21:20Z');

INSERT INTO payouts (id, user_id, wallet_id, recipient_id, recipient_rail_id, user_transaction_id, idempotency_key_id, rail, status, currency, gross_amount_minor, fee_amount_minor, net_amount_minor, reference, created_at, updated_at, submitted_at, completed_at, failed_at) VALUES
  ('13131313-1313-1313-1313-131313131313', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', '12121212-1212-1212-1212-121212121212', '99999999-9999-9999-9999-999999999991', 'ach', 'paid', 'USD', 3200, 3000, 200, 'payout-001', '2026-03-22T01:20:00Z', '2026-03-22T01:21:20Z', '2026-03-22T01:20:05Z', '2026-03-22T01:21:20Z', NULL);

INSERT INTO payout_attempts (id, payout_id, idempotency_key_id, provider, external_request_id, external_payout_id, status, request_payload, response_payload, submitted_at, resolved_at, created_at) VALUES
  ('14141414-1414-1414-1414-141414141414', '13131313-1313-1313-1313-131313131313', '99999999-9999-9999-9999-999999999991', 'demo_psp', 'req_001', 'po_ext_001', 'succeeded', '{"grossAmountMinor":3200,"netAmountMinor":200,"currency":"USD"}'::jsonb, '{"status":"paid"}'::jsonb, '2026-03-22T01:20:05Z', '2026-03-22T01:21:20Z', '2026-03-22T01:20:05Z');

INSERT INTO ledger_accounts (id, code, name, account_type, owner_type, owner_id, currency, status, metadata, created_at, updated_at) VALUES
  ('15151515-1515-1515-1515-151515151511', 'wallet_alice_usd', 'Alice Wallet USD', 'liability', 'wallet', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'USD', 'open', '{}'::jsonb, '2026-03-22T01:00:00Z', '2026-03-22T01:00:00Z'),
  ('15151515-1515-1515-1515-151515151512', 'platform_cash_usd', 'Platform Cash USD', 'asset', 'platform', NULL, 'USD', 'open', '{}'::jsonb, '2026-03-22T01:00:00Z', '2026-03-22T01:00:00Z'),
  ('15151515-1515-1515-1515-151515151513', 'platform_revenue_usd', 'Platform Revenue USD', 'revenue', 'platform', NULL, 'USD', 'open', '{}'::jsonb, '2026-03-22T01:00:00Z', '2026-03-22T01:00:00Z'),
  ('15151515-1515-1515-1515-151515151514', 'recipient_payable_usd', 'Recipient Payable USD', 'liability', 'recipient', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'USD', 'open', '{}'::jsonb, '2026-03-22T01:00:00Z', '2026-03-22T01:00:00Z');

INSERT INTO ledger_transactions (id, user_transaction_id, webhook_event_id, transaction_type, status, currency, reference, description, created_at, posted_at, reversed_at) VALUES
  ('16161616-1616-1616-1616-161616161611', '12121212-1212-1212-1212-121212121211', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'funding', 'posted', 'USD', 'funding-001', 'Inbound funding recognized from provider webhook', '2026-03-22T01:10:30Z', '2026-03-22T01:10:30Z', NULL),
  ('16161616-1616-1616-1616-161616161612', '12121212-1212-1212-1212-121212121212', NULL, 'payout', 'posted', 'USD', 'payout-001', 'Deduct wallet and allocate fee plus payable', '2026-03-22T01:20:00Z', '2026-03-22T01:20:00Z', NULL),
  ('16161616-1616-1616-1616-161616161613', NULL, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'payout_settlement', 'posted', 'USD', 'payout-001-settlement', 'Settle payable to platform cash after PSP confirmation', '2026-03-22T01:21:20Z', '2026-03-22T01:21:20Z', NULL);

INSERT INTO ledger_entries (id, ledger_transaction_id, ledger_account_id, direction, currency, amount_minor, description, created_at) VALUES
  ('17171717-1717-1717-1717-171717171711', '16161616-1616-1616-1616-161616161611', '15151515-1515-1515-1515-151515151512', 'debit', 'USD', 10000, 'PSP cash received', '2026-03-22T01:10:30Z'),
  ('17171717-1717-1717-1717-171717171712', '16161616-1616-1616-1616-161616161611', '15151515-1515-1515-1515-151515151511', 'credit', 'USD', 10000, 'Wallet liability increased', '2026-03-22T01:10:30Z'),
  ('17171717-1717-1717-1717-171717171713', '16161616-1616-1616-1616-161616161612', '15151515-1515-1515-1515-151515151511', 'debit', 'USD', 3200, 'Wallet debited for payout', '2026-03-22T01:20:00Z'),
  ('17171717-1717-1717-1717-171717171714', '16161616-1616-1616-1616-161616161612', '15151515-1515-1515-1515-151515151513', 'credit', 'USD', 3000, 'Platform revenue booked', '2026-03-22T01:20:00Z'),
  ('17171717-1717-1717-1717-171717171715', '16161616-1616-1616-1616-161616161612', '15151515-1515-1515-1515-151515151514', 'credit', 'USD', 200, 'Recipient payable booked', '2026-03-22T01:20:00Z'),
  ('17171717-1717-1717-1717-171717171716', '16161616-1616-1616-1616-161616161613', '15151515-1515-1515-1515-151515151514', 'debit', 'USD', 200, 'Recipient payable settled', '2026-03-22T01:21:20Z'),
  ('17171717-1717-1717-1717-171717171717', '16161616-1616-1616-1616-161616161613', '15151515-1515-1515-1515-151515151512', 'credit', 'USD', 200, 'Platform cash reduced on settlement', '2026-03-22T01:21:20Z');
