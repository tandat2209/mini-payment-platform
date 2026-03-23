import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import { encodeTransactionCursor } from '../../shared/api/cursor';
import {
  type AdminTransactionDetailView,
  type AdminTransactionListFilters,
  type AdminTransactionListItemView,
  type AdminTransactionListView,
  type AdminTransactionQueryRepository,
} from '../domain/admin-transaction-query.repository';

type AdminTransactionRow = {
  currency: string;
  customer_external_ref: string;
  customer_id: string;
  description: string;
  direction: string;
  fee_amount_minor: string;
  gross_amount_minor: string;
  id: string;
  net_amount_minor: string;
  occurred_at: Date | string;
  posted_at: Date | string | null;
  reference: string | null;
  status: string;
  type: string;
  wallet_id: string;
  webhook_event_id: string | null;
};

type AdminTransactionDetailRow = AdminTransactionRow & {
  payout_id: string | null;
  payout_reference: string | null;
  recipient_id: string | null;
  recipient_name: string | null;
};

type LinkedLedgerTransactionRow = {
  description: string | null;
  id: string;
  posted_at: Date | string | null;
  reference: string | null;
  status: string;
  transaction_type: string;
};

@Injectable()
export class SqlAdminTransactionQueryRepository implements AdminTransactionQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getTransactionDetail(transactionId: string): Promise<AdminTransactionDetailView | null> {
    const result = await this.databaseService.query<AdminTransactionDetailRow>(
      `
        SELECT
          ut.id,
          ut.type,
          ut.direction,
          ut.status,
          ut.currency,
          ut.gross_amount_minor::text AS gross_amount_minor,
          ut.fee_amount_minor::text AS fee_amount_minor,
          ut.net_amount_minor::text AS net_amount_minor,
          ut.description,
          ut.reference,
          ut.occurred_at,
          ut.posted_at,
          ut.wallet_id::text AS wallet_id,
          ut.webhook_event_id::text AS webhook_event_id,
          u.id::text AS customer_id,
          u.external_ref AS customer_external_ref,
          p.id::text AS payout_id,
          p.reference AS payout_reference,
          r.id::text AS recipient_id,
          r.name AS recipient_name
        FROM user_transactions ut
        JOIN users u
          ON u.id = ut.user_id
        LEFT JOIN payouts p
          ON p.user_transaction_id = ut.id
        LEFT JOIN recipients r
          ON r.id = p.recipient_id
        WHERE ut.id = $1::uuid
        LIMIT 1
      `,
      [transactionId],
    );

    const transaction = result.rows[0];

    if (!transaction) {
      return null;
    }

    const linkedLedgerTransactionsResult =
      await this.databaseService.query<LinkedLedgerTransactionRow>(
        `
          SELECT
            lt.id,
            lt.reference,
            lt.description,
            lt.transaction_type,
            lt.status,
            lt.posted_at
          FROM ledger_transactions lt
          WHERE lt.user_transaction_id = $1::uuid
          ORDER BY COALESCE(lt.posted_at, lt.created_at) DESC, lt.id DESC
        `,
        [transactionId],
      );

    return {
      ...this.mapTransactionRow(transaction),
      linkedLedgerTransactions: linkedLedgerTransactionsResult.rows.map((row) => ({
        description: row.description,
        id: row.id,
        postedAt: row.posted_at,
        reference: row.reference,
        status: row.status,
        transactionType: row.transaction_type,
      })),
      payoutContext: transaction.payout_id
        ? {
            payoutId: transaction.payout_id,
            payoutReference: transaction.payout_reference,
            recipientId: transaction.recipient_id,
            recipientName: transaction.recipient_name,
          }
        : null,
    };
  }

  async listTransactions(filters: AdminTransactionListFilters): Promise<AdminTransactionListView> {
    const parameters: unknown[] = [];
    const conditions = ['1 = 1'];

    if (filters.currency) {
      parameters.push(filters.currency);
      conditions.push(`ut.currency = $${parameters.length}`);
    }

    if (filters.type) {
      parameters.push(filters.type);
      conditions.push(`ut.type = $${parameters.length}`);
    }

    if (filters.status) {
      parameters.push(filters.status);
      conditions.push(`ut.status = $${parameters.length}`);
    }

    if (filters.dateFrom) {
      parameters.push(filters.dateFrom);
      conditions.push(`ut.occurred_at >= $${parameters.length}::timestamptz`);
    }

    if (filters.dateTo) {
      parameters.push(filters.dateTo);
      conditions.push(`ut.occurred_at <= $${parameters.length}::timestamptz`);
    }

    if (filters.query) {
      parameters.push(`%${filters.query}%`);
      conditions.push(
        `(
          u.external_ref ILIKE $${parameters.length}
          OR COALESCE(ut.reference, '') ILIKE $${parameters.length}
          OR ut.description ILIKE $${parameters.length}
          OR ut.id::text ILIKE $${parameters.length}
          OR ut.wallet_id::text ILIKE $${parameters.length}
        )`,
      );
    }

    if (filters.cursor) {
      parameters.push(filters.cursor.occurredAt);
      parameters.push(filters.cursor.id);
      conditions.push(
        `(ut.occurred_at < $${parameters.length - 1}::timestamptz OR (ut.occurred_at = $${parameters.length - 1}::timestamptz AND ut.id < $${parameters.length}::uuid))`,
      );
    }

    parameters.push(filters.limit + 1);

    const result = await this.databaseService.query<AdminTransactionRow>(
      `
        SELECT
          ut.id,
          ut.type,
          ut.direction,
          ut.status,
          ut.currency,
          ut.gross_amount_minor::text AS gross_amount_minor,
          ut.fee_amount_minor::text AS fee_amount_minor,
          ut.net_amount_minor::text AS net_amount_minor,
          ut.description,
          ut.reference,
          ut.occurred_at,
          ut.posted_at,
          ut.wallet_id::text AS wallet_id,
          ut.webhook_event_id::text AS webhook_event_id,
          u.id::text AS customer_id,
          u.external_ref AS customer_external_ref
        FROM user_transactions ut
        JOIN users u
          ON u.id = ut.user_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY ut.occurred_at DESC, ut.id DESC
        LIMIT $${parameters.length}
      `,
      parameters,
    );

    const hasNextPage = result.rows.length > filters.limit;
    const items = (hasNextPage ? result.rows.slice(0, filters.limit) : result.rows).map((row) =>
      this.mapTransactionRow(row),
    );
    const lastItem = items[items.length - 1];

    return {
      items,
      nextCursor:
        hasNextPage && lastItem
          ? encodeTransactionCursor({
              id: lastItem.id,
              occurredAt:
                lastItem.occurredAt instanceof Date
                  ? lastItem.occurredAt.toISOString()
                  : new Date(lastItem.occurredAt).toISOString(),
            })
          : null,
    };
  }

  private mapTransactionRow(row: AdminTransactionRow): AdminTransactionListItemView {
    return {
      currency: row.currency,
      customerExternalRef: row.customer_external_ref,
      customerId: row.customer_id,
      description: row.description,
      direction: row.direction,
      feeAmountMinor: row.fee_amount_minor,
      grossAmountMinor: row.gross_amount_minor,
      id: row.id,
      netAmountMinor: row.net_amount_minor,
      occurredAt: row.occurred_at,
      postedAt: row.posted_at,
      reference: row.reference,
      status: row.status,
      type: row.type,
      walletId: row.wallet_id,
      webhookEventId: row.webhook_event_id,
    };
  }
}
