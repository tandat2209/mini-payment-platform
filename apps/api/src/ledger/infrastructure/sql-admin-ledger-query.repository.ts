import { BadRequestException, Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import {
  getLedgerAccountGroup,
  getLedgerAccountGroupDescription,
} from '../domain/admin-ledger-account-group';
import {
  type AdminLedgerCursor,
  type AdminLedgerDetailView,
  type AdminLedgerEntryView,
  type AdminLedgerListFilters,
  type AdminLedgerListItemView,
  type AdminLedgerListView,
  type AdminLedgerQueryRepository,
  type AdminLedgerSummaryView,
} from '../domain/admin-ledger-query.repository';

type AdminLedgerListRow = {
  credit_amount_minor: string;
  currency: string;
  debit_amount_minor: string;
  description: string | null;
  entry_count: string;
  id: string;
  posted_at: Date | string | null;
  reference: string | null;
  status: string;
  transaction_type: string;
  user_transaction_id: string | null;
  webhook_event_id: string | null;
};

type AdminLedgerEntryRow = {
  account_code: string;
  account_id: string;
  account_name: string;
  account_type: string;
  amount_minor: string;
  currency: string;
  description: string | null;
  direction: string;
  id: string;
  owner_id: string | null;
  owner_type: string | null;
};

type LedgerAccountSummaryRow = {
  account_code: string;
  account_name: string;
  account_type: string;
  credit_amount_minor: string;
  currency: string;
  debit_amount_minor: string;
};

type LedgerCurrencySummaryRow = {
  credit_amount_minor: string;
  currency: string;
  debit_amount_minor: string;
};

type LedgerUnbalancedRow = {
  unbalanced_transactions: string;
};

@Injectable()
export class SqlAdminLedgerQueryRepository implements AdminLedgerQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getLedgerTransactionDetail(
    ledgerTransactionId: string,
  ): Promise<AdminLedgerDetailView | null> {
    const transactionResult = await this.databaseService.query<AdminLedgerListRow>(
      `
        SELECT
          lt.id,
          lt.transaction_type,
          lt.status,
          lt.currency,
          lt.reference,
          lt.description,
          lt.posted_at,
          lt.user_transaction_id::text AS user_transaction_id,
          lt.webhook_event_id::text AS webhook_event_id,
          COUNT(le.id)::text AS entry_count,
          COALESCE(
            SUM(CASE WHEN le.direction = 'debit' THEN le.amount_minor ELSE 0 END),
            0
          )::text AS debit_amount_minor,
          COALESCE(
            SUM(CASE WHEN le.direction = 'credit' THEN le.amount_minor ELSE 0 END),
            0
          )::text AS credit_amount_minor
        FROM ledger_transactions lt
        LEFT JOIN ledger_entries le
          ON le.ledger_transaction_id = lt.id
        WHERE lt.id = $1::uuid
        GROUP BY lt.id
        LIMIT 1
      `,
      [ledgerTransactionId],
    );

    const transaction = transactionResult.rows[0];

    if (!transaction) {
      return null;
    }

    const entriesResult = await this.databaseService.query<AdminLedgerEntryRow>(
      `
        SELECT
          le.id,
          le.direction,
          le.currency,
          le.amount_minor::text AS amount_minor,
          le.description,
          la.id::text AS account_id,
          la.code AS account_code,
          la.name AS account_name,
          la.account_type,
          la.owner_type,
          la.owner_id::text AS owner_id
        FROM ledger_entries le
        JOIN ledger_accounts la
          ON la.id = le.ledger_account_id
        WHERE le.ledger_transaction_id = $1::uuid
        ORDER BY
          CASE WHEN le.direction = 'debit' THEN 0 ELSE 1 END ASC,
          le.amount_minor DESC,
          le.id ASC
      `,
      [ledgerTransactionId],
    );

    return {
      ...this.mapLedgerListRow(transaction),
      entries: entriesResult.rows.map((row) => this.mapLedgerEntryRow(row)),
    };
  }

  async listLedgerTransactions(filters: AdminLedgerListFilters): Promise<AdminLedgerListView> {
    const { conditions, parameters } = this.buildFilterParts(filters, {
      includeCursor: true,
    });
    const listParameters = [...parameters, filters.limit + 1];

    const result = await this.databaseService.query<AdminLedgerListRow>(
      `
        SELECT
          lt.id,
          lt.transaction_type,
          lt.status,
          lt.currency,
          lt.reference,
          lt.description,
          lt.posted_at,
          lt.user_transaction_id::text AS user_transaction_id,
          lt.webhook_event_id::text AS webhook_event_id,
          COUNT(le.id)::text AS entry_count,
          COALESCE(
            SUM(CASE WHEN le.direction = 'debit' THEN le.amount_minor ELSE 0 END),
            0
          )::text AS debit_amount_minor,
          COALESCE(
            SUM(CASE WHEN le.direction = 'credit' THEN le.amount_minor ELSE 0 END),
            0
          )::text AS credit_amount_minor
        FROM ledger_transactions lt
        LEFT JOIN ledger_entries le
          ON le.ledger_transaction_id = lt.id
        WHERE ${conditions.join(' AND ')}
        GROUP BY lt.id
        ORDER BY COALESCE(lt.posted_at, lt.created_at) DESC, lt.id DESC
        LIMIT $${listParameters.length}
      `,
      listParameters,
    );

    const hasNextPage = result.rows.length > filters.limit;
    const items = (hasNextPage ? result.rows.slice(0, filters.limit) : result.rows).map((row) =>
      this.mapLedgerListRow(row),
    );
    const lastItem = items[items.length - 1];

    return {
      items,
      nextCursor:
        hasNextPage && lastItem
          ? encodeAdminLedgerCursor({
              id: lastItem.id,
              postedAt:
                lastItem.postedAt instanceof Date
                  ? lastItem.postedAt.toISOString()
                  : new Date(lastItem.postedAt ?? new Date().toISOString()).toISOString(),
            })
          : null,
      summary: await this.getLedgerSummary(filters),
    };
  }

  private async getLedgerSummary(filters: AdminLedgerListFilters): Promise<AdminLedgerSummaryView> {
    const { conditions, parameters } = this.buildFilterParts(filters, {
      includeCursor: false,
    });

    const [accountRows, currencyRows, unbalancedResult] = await Promise.all([
      this.databaseService.query<LedgerAccountSummaryRow>(
        `
          SELECT
            la.code AS account_code,
            la.name AS account_name,
            la.account_type,
            le.currency,
            COALESCE(
              SUM(CASE WHEN le.direction = 'debit' THEN le.amount_minor ELSE 0 END),
              0
            )::text AS debit_amount_minor,
            COALESCE(
              SUM(CASE WHEN le.direction = 'credit' THEN le.amount_minor ELSE 0 END),
              0
            )::text AS credit_amount_minor
          FROM ledger_transactions lt
          JOIN ledger_entries le
            ON le.ledger_transaction_id = lt.id
          JOIN ledger_accounts la
            ON la.id = le.ledger_account_id
          WHERE ${conditions.join(' AND ')}
          GROUP BY la.code, la.name, la.account_type, le.currency
          ORDER BY la.code ASC, le.currency ASC
        `,
        parameters,
      ),
      this.databaseService.query<LedgerCurrencySummaryRow>(
        `
          SELECT
            lt.currency,
            COALESCE(
              SUM(CASE WHEN le.direction = 'debit' THEN le.amount_minor ELSE 0 END),
              0
            )::text AS debit_amount_minor,
            COALESCE(
              SUM(CASE WHEN le.direction = 'credit' THEN le.amount_minor ELSE 0 END),
              0
            )::text AS credit_amount_minor
          FROM ledger_transactions lt
          LEFT JOIN ledger_entries le
            ON le.ledger_transaction_id = lt.id
          WHERE ${conditions.join(' AND ')}
          GROUP BY lt.currency
          ORDER BY lt.currency ASC
        `,
        parameters,
      ),
      this.databaseService.query<LedgerUnbalancedRow>(
        `
          SELECT COUNT(*)::text AS unbalanced_transactions
          FROM (
            SELECT
              lt.id,
              COALESCE(
                SUM(CASE WHEN le.direction = 'debit' THEN le.amount_minor ELSE 0 END),
                0
              ) AS debit_total,
              COALESCE(
                SUM(CASE WHEN le.direction = 'credit' THEN le.amount_minor ELSE 0 END),
                0
              ) AS credit_total
            FROM ledger_transactions lt
            LEFT JOIN ledger_entries le
              ON le.ledger_transaction_id = lt.id
            WHERE ${conditions.join(' AND ')}
            GROUP BY lt.id
          ) transaction_totals
          WHERE debit_total <> credit_total
        `,
        parameters,
      ),
    ]);

    const accountGroups = new Map<
      string,
      {
        accountCount: number;
        accountGroup: string;
        creditMinor: bigint;
        currency: string;
        debitMinor: bigint;
        description: string;
      }
    >();

    for (const row of accountRows.rows) {
      const accountGroup = getLedgerAccountGroup(row.account_code);
      const key = `${accountGroup}:${row.currency}`;
      const current = accountGroups.get(key) ?? {
        accountCount: 0,
        accountGroup,
        creditMinor: 0n,
        currency: row.currency,
        debitMinor: 0n,
        description: getLedgerAccountGroupDescription(accountGroup),
      };

      current.accountCount += 1;
      current.creditMinor += BigInt(row.credit_amount_minor);
      current.debitMinor += BigInt(row.debit_amount_minor);
      accountGroups.set(key, current);
    }

    return {
      accountGroupSummaries: [...accountGroups.values()]
        .sort((left, right) =>
          `${left.accountGroup}:${left.currency}`.localeCompare(
            `${right.accountGroup}:${right.currency}`,
          ),
        )
        .map((summary) => ({
          accountCount: summary.accountCount,
          accountGroup: summary.accountGroup,
          creditAmountMinor: summary.creditMinor.toString(),
          currency: summary.currency,
          debitAmountMinor: summary.debitMinor.toString(),
          description: summary.description,
          netAmountMinor: (summary.debitMinor - summary.creditMinor).toString(),
        })),
      currencySummaries: currencyRows.rows.map((row) => ({
        creditAmountMinor: row.credit_amount_minor,
        currency: row.currency,
        debitAmountMinor: row.debit_amount_minor,
        deltaAmountMinor: (
          BigInt(row.debit_amount_minor) - BigInt(row.credit_amount_minor)
        ).toString(),
      })),
      trialBalanceRows: accountRows.rows.map((row) => ({
        accountCode: row.account_code,
        accountGroup: getLedgerAccountGroup(row.account_code),
        accountName: row.account_name,
        accountType: row.account_type,
        creditAmountMinor: row.credit_amount_minor,
        currency: row.currency,
        debitAmountMinor: row.debit_amount_minor,
        netAmountMinor: (
          BigInt(row.debit_amount_minor) - BigInt(row.credit_amount_minor)
        ).toString(),
      })),
      unbalancedTransactions: Number(unbalancedResult.rows[0]?.unbalanced_transactions ?? '0'),
    };
  }

  private buildFilterParts(
    filters: AdminLedgerListFilters,
    options: {
      includeCursor: boolean;
    },
  ): {
    conditions: string[];
    parameters: unknown[];
  } {
    const parameters: unknown[] = [];
    const conditions = ['1 = 1'];

    if (filters.currency) {
      parameters.push(filters.currency);
      conditions.push(`lt.currency = $${parameters.length}`);
    }

    if (filters.transactionType) {
      parameters.push(filters.transactionType);
      conditions.push(`lt.transaction_type = $${parameters.length}`);
    }

    if (filters.status) {
      parameters.push(filters.status);
      conditions.push(`lt.status = $${parameters.length}`);
    }

    if (filters.query) {
      parameters.push(`%${filters.query}%`);
      conditions.push(
        `(
          COALESCE(lt.reference, '') ILIKE $${parameters.length}
          OR COALESCE(lt.description, '') ILIKE $${parameters.length}
          OR lt.id::text ILIKE $${parameters.length}
          OR COALESCE(lt.user_transaction_id::text, '') ILIKE $${parameters.length}
          OR COALESCE(lt.webhook_event_id::text, '') ILIKE $${parameters.length}
        )`,
      );
    }

    if (options.includeCursor && filters.cursor) {
      parameters.push(filters.cursor.postedAt);
      parameters.push(filters.cursor.id);
      conditions.push(
        `(COALESCE(lt.posted_at, lt.created_at) < $${parameters.length - 1}::timestamptz OR (COALESCE(lt.posted_at, lt.created_at) = $${parameters.length - 1}::timestamptz AND lt.id < $${parameters.length}::uuid))`,
      );
    }

    return {
      conditions,
      parameters,
    };
  }

  private mapLedgerEntryRow(row: AdminLedgerEntryRow): AdminLedgerEntryView {
    return {
      accountCode: row.account_code,
      accountId: row.account_id,
      accountName: row.account_name,
      accountType: row.account_type,
      amountMinor: row.amount_minor,
      currency: row.currency,
      description: row.description,
      direction: row.direction,
      id: row.id,
      ownerId: row.owner_id,
      ownerType: row.owner_type,
    };
  }

  private mapLedgerListRow(row: AdminLedgerListRow): AdminLedgerListItemView {
    return {
      creditAmountMinor: row.credit_amount_minor,
      currency: row.currency,
      debitAmountMinor: row.debit_amount_minor,
      description: row.description,
      entryCount: Number(row.entry_count),
      id: row.id,
      postedAt: row.posted_at,
      reference: row.reference,
      status: row.status,
      transactionType: row.transaction_type,
      userTransactionId: row.user_transaction_id,
      webhookEventId: row.webhook_event_id,
    };
  }
}

export function decodeAdminLedgerCursor(rawCursor?: string): AdminLedgerCursor | null {
  if (!rawCursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(rawCursor, 'base64url').toString('utf8')) as {
      id?: unknown;
      postedAt?: unknown;
    };

    if (typeof parsed.id !== 'string' || typeof parsed.postedAt !== 'string') {
      throw new Error('Invalid cursor payload');
    }

    return {
      id: parsed.id,
      postedAt: parsed.postedAt,
    };
  } catch {
    throw new BadRequestException('Invalid ledger cursor');
  }
}

function encodeAdminLedgerCursor(cursor: AdminLedgerCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}
