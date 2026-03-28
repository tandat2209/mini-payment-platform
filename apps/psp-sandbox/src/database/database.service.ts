import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

export type DatabaseHealth =
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

export interface DatabaseQueryable {
  query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    parameters?: readonly unknown[],
  ): Promise<QueryResult<T>>;
}

@Injectable()
export class DatabaseService implements DatabaseQueryable, OnModuleDestroy {
  private readonly databaseUrl: string | undefined;
  private readonly pool: Pool | null;

  constructor(private readonly configService: ConfigService) {
    this.databaseUrl = this.configService.get<string>('DATABASE_URL');
    this.pool = this.databaseUrl
      ? new Pool({
          connectionString: this.databaseUrl,
          max: 10,
        })
      : null;
  }

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
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('DATABASE_URL is not configured');
    }

    return await this.pool.query<T>(sql, [...parameters]);
  }

  async transaction<T>(callback: (database: DatabaseQueryable) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('DATABASE_URL is not configured');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(createTransactionalQueryable(client));
      await client.query('COMMIT');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}

function createTransactionalQueryable(client: PoolClient): DatabaseQueryable {
  return {
    query<T extends QueryResultRow = QueryResultRow>(
      sql: string,
      parameters: readonly unknown[] = [],
    ): Promise<QueryResult<T>> {
      return client.query<T>(sql, [...parameters]);
    },
  };
}
