import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import { encodeTransactionCursor } from '../../shared/api/cursor';
import {
  type TransactionDetailView,
  type TransactionListFilters,
  type TransactionListItemView,
  type TransactionListView,
  type TransactionQueryRepository,
} from '../domain/transaction-query.repository';

type TransactionRow = {
  currency: string;
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
};

type TransactionDetailRow = TransactionRow & {
  payout_completed_at: Date | string | null;
  payout_failed_at: Date | string | null;
  payout_id: string | null;
  payout_reference: string | null;
  payout_returned_amount_minor: string | null;
  payout_returned_at: Date | string | null;
  payout_status:
    | 'failed'
    | 'paid'
    | 'pending_submission'
    | 'processing'
    | 'returned'
    | 'submitted'
    | null;
  recipient_id: string | null;
  recipient_name: string | null;
  payout_submitted_at: Date | string | null;
  wallet_restored_amount_minor: string | null;
};

@Injectable()
export class SqlTransactionQueryRepository implements TransactionQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listTransactions(
    customerId: string,
    filters: TransactionListFilters,
  ): Promise<TransactionListView> {
    const parameters: unknown[] = [customerId];
    const conditions = ['ut.user_id = $1'];

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

    if (filters.cursor) {
      parameters.push(filters.cursor.occurredAt);
      parameters.push(filters.cursor.id);
      conditions.push(
        `(ut.occurred_at < $${parameters.length - 1}::timestamptz OR (ut.occurred_at = $${parameters.length - 1}::timestamptz AND ut.id < $${parameters.length}::uuid))`,
      );
    }

    parameters.push(filters.limit + 1);

    const result = await this.databaseService.query<TransactionRow>(
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
          ut.posted_at
        FROM user_transactions ut
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

  async getTransactionDetail(
    customerId: string,
    transactionId: string,
  ): Promise<TransactionDetailView | null> {
    const result = await this.databaseService.query<TransactionDetailRow>(
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
          p.id AS payout_id,
          p.reference AS payout_reference,
          p.status AS payout_status,
          p.submitted_at AS payout_submitted_at,
          p.completed_at AS payout_completed_at,
          p.failed_at AS payout_failed_at,
          p.returned_at AS payout_returned_at,
          p.returned_amount_minor::text AS payout_returned_amount_minor,
          CASE
            WHEN p.returned_amount_minor IS NOT NULL
              THEN (p.returned_amount_minor + p.fee_amount_minor)::text
            ELSE NULL
          END AS wallet_restored_amount_minor,
          r.id AS recipient_id,
          r.name AS recipient_name
        FROM user_transactions ut
        LEFT JOIN payouts p
          ON p.user_transaction_id = ut.id
          OR p.id = ut.related_payout_id
        LEFT JOIN recipients r
          ON r.id = p.recipient_id
        WHERE ut.user_id = $1
          AND ut.id = $2
        LIMIT 1
      `,
      [customerId, transactionId],
    );

    const transaction = result.rows[0];

    if (!transaction) {
      return null;
    }

    return {
      ...this.mapTransactionRow(transaction),
      payoutContext: transaction.payout_id
        ? {
            completedAt: transaction.payout_completed_at,
            failedAt: transaction.payout_failed_at,
            payoutId: transaction.payout_id,
            payoutReference: transaction.payout_reference,
            returnedAt: transaction.payout_returned_at,
            returnedAmountMinor: transaction.payout_returned_amount_minor,
            status: transaction.payout_status ?? 'submitted',
            recipientId: transaction.recipient_id,
            recipientName: transaction.recipient_name,
            submittedAt: transaction.payout_submitted_at,
            walletRestoredAmountMinor: transaction.wallet_restored_amount_minor,
          }
        : null,
    };
  }

  private mapTransactionRow(row: TransactionRow): TransactionListItemView {
    return {
      currency: row.currency,
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
    };
  }
}
