import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import {
  type StatementDetailView,
  type StatementLineItemView,
  type StatementPeriodView,
  type StatementQueryRepository,
} from '../domain/statement-query.repository';

type WalletRow = {
  id: string;
};

type StatementPeriodRow = {
  currency: string;
  month: string;
  wallet_id: string;
  year: string;
};

type StatementSummaryRow = {
  closing_balance_minor: string;
  opening_balance_minor: string;
  total_credits_minor: string;
  total_debits_minor: string;
};

type StatementLineItemRow = {
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

@Injectable()
export class SqlStatementQueryRepository implements StatementQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listAvailableStatementPeriods(customerId: string): Promise<StatementPeriodView[] | null> {
    const activeWallet = await this.findActiveWallet(customerId);

    if (!activeWallet) {
      return null;
    }

    const result = await this.databaseService.query<StatementPeriodRow>(
      `
        SELECT
          ut.wallet_id,
          ut.currency,
          EXTRACT(YEAR FROM COALESCE(ut.posted_at, ut.occurred_at))::text AS year,
          EXTRACT(MONTH FROM COALESCE(ut.posted_at, ut.occurred_at))::text AS month
        FROM user_transactions ut
        WHERE ut.user_id = $1
          AND ut.wallet_id = $2
          AND ut.status IN ('posted', 'completed', 'reversed')
        GROUP BY ut.wallet_id, ut.currency, year, month
        ORDER BY year DESC, month DESC, ut.currency ASC
      `,
      [customerId, activeWallet.id],
    );

    return result.rows.map((row) => ({
      currency: row.currency,
      month: Number(row.month),
      walletId: row.wallet_id,
      year: Number(row.year),
    }));
  }

  async getStatementDetail(
    customerId: string,
    walletId: string,
    currency: string,
    year: number,
    month: number,
  ): Promise<StatementDetailView | null> {
    const activeWallet = await this.findActiveWallet(customerId, walletId);

    if (!activeWallet) {
      return null;
    }

    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 1));

    const lineItemsResult = await this.databaseService.query<StatementLineItemRow>(
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
        WHERE ut.user_id = $1
          AND ut.wallet_id = $2
          AND ut.currency = $3
          AND ut.status IN ('posted', 'completed', 'reversed')
          AND COALESCE(ut.posted_at, ut.occurred_at) >= $4::timestamptz
          AND COALESCE(ut.posted_at, ut.occurred_at) < $5::timestamptz
        ORDER BY COALESCE(ut.posted_at, ut.occurred_at) ASC, ut.id ASC
      `,
      [customerId, walletId, currency, periodStart.toISOString(), periodEnd.toISOString()],
    );

    if (lineItemsResult.rows.length === 0) {
      return null;
    }

    const summaryResult = await this.databaseService.query<StatementSummaryRow>(
      `
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN COALESCE(ut.posted_at, ut.occurred_at) < $4::timestamptz
                  THEN CASE WHEN ut.direction = 'credit'
                    THEN ut.net_amount_minor
                    ELSE -ut.net_amount_minor
                  END
                ELSE 0
              END
            ),
            0
          )::text AS opening_balance_minor,
          COALESCE(
            SUM(
              CASE
                WHEN COALESCE(ut.posted_at, ut.occurred_at) >= $4::timestamptz
                  AND COALESCE(ut.posted_at, ut.occurred_at) < $5::timestamptz
                  AND ut.direction = 'credit'
                  THEN ut.net_amount_minor
                ELSE 0
              END
            ),
            0
          )::text AS total_credits_minor,
          COALESCE(
            SUM(
              CASE
                WHEN COALESCE(ut.posted_at, ut.occurred_at) >= $4::timestamptz
                  AND COALESCE(ut.posted_at, ut.occurred_at) < $5::timestamptz
                  AND ut.direction = 'debit'
                  THEN ut.net_amount_minor
                ELSE 0
              END
            ),
            0
          )::text AS total_debits_minor,
          COALESCE(
            SUM(
              CASE
                WHEN COALESCE(ut.posted_at, ut.occurred_at) < $5::timestamptz
                  THEN CASE WHEN ut.direction = 'credit'
                    THEN ut.net_amount_minor
                    ELSE -ut.net_amount_minor
                  END
                ELSE 0
              END
            ),
            0
          )::text AS closing_balance_minor
        FROM user_transactions ut
        WHERE ut.user_id = $1
          AND ut.wallet_id = $2
          AND ut.currency = $3
          AND ut.status IN ('posted', 'completed', 'reversed')
      `,
      [customerId, walletId, currency, periodStart.toISOString(), periodEnd.toISOString()],
    );

    const summary = summaryResult.rows[0];

    return {
      closingBalanceMinor: summary?.closing_balance_minor ?? '0',
      currency,
      lineItems: lineItemsResult.rows.map((row) => this.mapLineItem(row)),
      month,
      openingBalanceMinor: summary?.opening_balance_minor ?? '0',
      totalCreditsMinor: summary?.total_credits_minor ?? '0',
      totalDebitsMinor: summary?.total_debits_minor ?? '0',
      walletId,
      year,
    };
  }

  private async findActiveWallet(customerId: string, walletId?: string): Promise<WalletRow | null> {
    const result = await this.databaseService.query<WalletRow>(
      `
        SELECT id
        FROM wallets
        WHERE user_id = $1
          AND status = 'active'
          ${walletId ? 'AND id = $2' : ''}
        LIMIT 1
      `,
      walletId ? [customerId, walletId] : [customerId],
    );

    return result.rows[0] ?? null;
  }

  private mapLineItem(row: StatementLineItemRow): StatementLineItemView {
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
