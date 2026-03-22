import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';

const packageRoot = process.cwd();
const migrationPath = path.join(packageRoot, 'migrations', '0001_financial_foundation.sql');
const seedPath = path.join(packageRoot, 'seeds', '001_financial_scenarios.sql');

async function loadSql(filePath) {
  return readFile(filePath, 'utf8');
}

async function assertRejects(label, action) {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(`${label} was expected to fail but it succeeded`);
}

async function getCount(db, sql) {
  const result = await db.query(sql);
  const value = result.rows[0]?.count;

  return Number(value ?? 0);
}

async function main() {
  const db = new PGlite();

  try {
    const migrationSql = await loadSql(migrationPath);
    const seedSql = await loadSql(seedPath);

    await db.exec(migrationSql);
    await db.exec(seedSql);

    await assertRejects('one active wallet per user', async () => {
      await db.exec(`
        INSERT INTO wallets (id, user_id, status, label)
        VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111111', 'active', 'Alice duplicate active wallet');
      `);
    });

    await assertRejects('one balance row per wallet currency', async () => {
      await db.exec(`
        INSERT INTO wallet_balances (id, wallet_id, currency, available_amount_minor, pending_amount_minor)
        VALUES ('baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'USD', 1, 0);
      `);
    });

    await assertRejects('webhook deduplication', async () => {
      await db.exec(`
        INSERT INTO webhook_events (id, provider, external_event_id, event_type, payload)
        VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'demo_psp', 'evt_funding_001', 'funding.completed', '{}'::jsonb);
      `);
    });

    await assertRejects('idempotency deduplication', async () => {
      await db.exec(`
        INSERT INTO idempotency_keys (id, scope, key)
        VALUES ('99999999-9999-9999-9999-999999999992', 'payout:create', 'payout-alice-001');
      `);
    });

    const statementRows = await getCount(
      db,
      `
        SELECT COUNT(*) AS count
        FROM user_transactions ut
        JOIN wallets w ON w.id = ut.wallet_id
        JOIN users u ON u.id = ut.user_id
        WHERE u.external_ref = 'user_demo_alice'
          AND w.status = 'active'
          AND ut.currency = 'USD';
      `,
    );

    if (statementRows < 2) {
      throw new Error('Expected statement query to return seeded user transaction rows');
    }

    const payoutRows = await getCount(
      db,
      `
        SELECT COUNT(*) AS count
        FROM payouts p
        JOIN payout_attempts pa ON pa.payout_id = p.id
        JOIN recipients r ON r.id = p.recipient_id
        WHERE p.reference = 'payout-001'
          AND pa.external_payout_id = 'po_ext_001'
          AND r.name = 'Vendor One';
      `,
    );

    if (payoutRows !== 1) {
      throw new Error('Expected payout operations query to resolve exactly one seeded payout');
    }

    const reconciliationRows = await getCount(
      db,
      `
        SELECT COUNT(*) AS count
        FROM payout_attempts pa
        JOIN payouts p ON p.id = pa.payout_id
        JOIN ledger_transactions lt ON lt.reference = p.reference
        JOIN webhook_events we ON we.external_event_id = 'evt_payout_001'
        WHERE pa.external_payout_id = 'po_ext_001'
          AND lt.currency = 'USD'
          AND we.provider = 'demo_psp';
      `,
    );

    if (reconciliationRows < 1) {
      throw new Error('Expected reconciliation query to resolve provider and ledger linkage');
    }

    console.log('Financial schema verification passed.');
    console.log(`Statement query rows: ${statementRows}`);
    console.log(`Payout query rows: ${payoutRows}`);
    console.log(`Reconciliation query rows: ${reconciliationRows}`);
  } finally {
    await db.close();
  }
}

void main();
