import { readFile } from 'node:fs/promises';
import path from 'node:path';

import pg from 'pg';

const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/payment_platform_mini';

const { Client } = pg;

async function main() {
  const relativeFilePath = process.argv[2];

  if (!relativeFilePath) {
    throw new Error('Usage: node scripts/apply-sql-file.mjs <relative-sql-file-path>');
  }

  const packageRoot = process.cwd();
  const sqlFilePath = path.resolve(packageRoot, relativeFilePath);
  const sql = await readFile(sqlFilePath, 'utf8');
  const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    await client.query(sql);

    console.log(`Applied ${relativeFilePath}`);
    console.log(`Database: ${databaseUrl}`);
  } finally {
    await client.end();
  }
}

void main();
