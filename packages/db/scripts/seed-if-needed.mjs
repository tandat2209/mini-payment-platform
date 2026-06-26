import { readFile } from 'node:fs/promises';
import path from 'node:path';

import pg from 'pg';

const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/payment_platform_mini';
const DETERMINISTIC_SEED_USER_ID = '11111111-1111-1111-1111-111111111111';

const { Client } = pg;

export async function hasDeterministicSeedData(database) {
  const result = await database.query(
    `
      SELECT 1
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [DETERMINISTIC_SEED_USER_ID],
  );

  return result.rowCount > 0;
}

async function main() {
  const packageRoot = process.cwd();
  const seedPath = path.resolve(packageRoot, 'seeds', '001_financial_scenarios.sql');
  const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();

    if (await hasDeterministicSeedData(client)) {
      console.log(
        'Skipped seeds/001_financial_scenarios.sql (deterministic seed data already present)',
      );
      console.log(`Database: ${databaseUrl}`);
      return;
    }

    const sql = await readFile(seedPath, 'utf8');
    await client.query(sql);
    console.log('Applied seeds/001_financial_scenarios.sql');
    console.log(`Database: ${databaseUrl}`);
  } finally {
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
