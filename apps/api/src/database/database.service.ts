import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, type QueryResultRow } from 'pg';

type DatabaseHealth =
  | {
      configured: false;
      status: 'not_configured';
    }
  | {
      configured: true;
      database: string;
      status: 'ok';
    }
  | {
      configured: true;
      error: string;
      status: 'error';
    };

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly databaseUrl = process.env.DATABASE_URL;
  private readonly pool = this.databaseUrl
    ? new Pool({
        connectionString: this.databaseUrl,
        max: 10,
      })
    : null;

  async getHealth(): Promise<DatabaseHealth> {
    if (!this.pool) {
      return {
        configured: false,
        status: 'not_configured',
      };
    }

    try {
      const result = await this.pool.query<{ current_database: string }>(
        'SELECT current_database() AS current_database',
      );

      return {
        configured: true,
        database: result.rows[0]?.current_database ?? 'unknown',
        status: 'ok',
      };
    } catch (error) {
      return {
        configured: true,
        error: error instanceof Error ? error.message : 'Unknown database error',
        status: 'error',
      };
    }
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    parameters: readonly unknown[] = [],
  ) {
    if (!this.pool) {
      throw new Error('DATABASE_URL is not configured');
    }

    return this.pool.query<T>(sql, [...parameters]);
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
