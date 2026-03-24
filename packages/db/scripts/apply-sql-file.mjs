import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { readdir } from 'node:fs/promises';

import pg from 'pg';

const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/payment_platform_mini';

const { Client } = pg;

async function main() {
  const relativePath = process.argv[2];

  if (!relativePath) {
    throw new Error('Usage: node scripts/apply-sql-file.mjs <relative-sql-file-path-or-dir>');
  }

  const packageRoot = process.cwd();
  const sqlPath = path.resolve(packageRoot, relativePath);
  const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    const sqlFiles = await resolveSqlFiles(sqlPath);
    const useMigrationTracking = shouldUseMigrationTracking(sqlPath);

    if (useMigrationTracking) {
      await ensureSchemaMigrationsTable(client);
      await bootstrapExistingFoundationMigration(client, sqlFiles, packageRoot);
    }

    for (const filePath of sqlFiles) {
      const relativeFilePath = path.relative(packageRoot, filePath);

      if (useMigrationTracking) {
        const alreadyApplied = await hasMigrationBeenApplied(client, relativeFilePath);

        if (alreadyApplied) {
          console.log(`Skipped ${relativeFilePath} (already applied)`);
          continue;
        }
      }

      const sql = await readFile(filePath, 'utf8');

      await client.query(sql);

      if (useMigrationTracking) {
        await recordAppliedMigration(client, relativeFilePath);
      }

      console.log(`Applied ${relativeFilePath}`);
    }

    console.log(`Database: ${databaseUrl}`);
  } finally {
    await client.end();
  }
}

async function resolveSqlFiles(targetPath) {
  const stats = await import('node:fs/promises').then(({ stat }) => stat(targetPath));

  if (!stats.isDirectory()) {
    return [targetPath];
  }

  const entries = await readdir(targetPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => path.join(targetPath, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function shouldUseMigrationTracking(targetPath) {
  return (
    path.basename(targetPath) === 'migrations' ||
    path.dirname(targetPath).split(path.sep).includes('migrations')
  );
}

async function ensureSchemaMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function hasMigrationBeenApplied(client, filename) {
  const result = await client.query(
    `
      SELECT 1
      FROM schema_migrations
      WHERE filename = $1
      LIMIT 1
    `,
    [filename],
  );

  return result.rowCount > 0;
}

async function recordAppliedMigration(client, filename) {
  await client.query(
    `
      INSERT INTO schema_migrations (filename)
      VALUES ($1)
      ON CONFLICT (filename) DO NOTHING
    `,
    [filename],
  );
}

async function bootstrapExistingFoundationMigration(client, sqlFiles, packageRoot) {
  const hasTrackedMigrations = await hasAnyTrackedMigrations(client);

  if (hasTrackedMigrations) {
    return;
  }

  const foundationMigration = sqlFiles.find(
    (filePath) => path.basename(filePath) === '0001_financial_foundation.sql',
  );

  if (!foundationMigration) {
    return;
  }

  const foundationAlreadyPresent = await hasFoundationSchema(client);

  if (!foundationAlreadyPresent) {
    return;
  }

  await recordAppliedMigration(client, path.relative(packageRoot, foundationMigration));
  console.log(
    `Bootstrapped ${path.relative(packageRoot, foundationMigration)} from existing schema`,
  );
}

async function hasAnyTrackedMigrations(client) {
  const result = await client.query(`
    SELECT 1
    FROM schema_migrations
    LIMIT 1
  `);

  return result.rowCount > 0;
}

async function hasFoundationSchema(client) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1
      FROM pg_type
      WHERE typname = 'wallet_status'
    ) AS has_wallet_status,
    EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'users'
    ) AS has_users_table
  `);

  const row = result.rows[0];

  return row?.has_wallet_status === true && row?.has_users_table === true;
}

void main();
