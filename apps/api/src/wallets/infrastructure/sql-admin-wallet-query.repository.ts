import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import {
  type AdminWalletBalanceSummaryView,
  type AdminWalletBalanceView,
  type AdminWalletListItemView,
  type AdminWalletQueryRepository,
} from '../domain/admin-wallet-query.repository';

type AdminWalletRow = {
  closed_at: Date | string | null;
  customer_external_ref: string;
  customer_id: string;
  last_movement_at: Date | string | null;
  opened_at: Date | string | null;
  wallet_id: string;
  wallet_label: string | null;
  wallet_status: string;
};

type AdminWalletBalanceRow = {
  available_amount_minor: string;
  currency: string;
  pending_amount_minor: string;
  updated_at: Date | string | null;
  wallet_id: string;
};

type AdminWalletBalanceSummaryRow = {
  active_wallet_count: number | string;
  available_amount_minor: string;
  currency: string;
  pending_amount_minor: string;
  posted_today: number | string;
};

@Injectable()
export class SqlAdminWalletQueryRepository implements AdminWalletQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listBalanceSummaries(): Promise<AdminWalletBalanceSummaryView[]> {
    const result = await this.databaseService.query<AdminWalletBalanceSummaryRow>(
      `
        SELECT
          wb.currency,
          SUM(wb.available_amount_minor)::text AS available_amount_minor,
          SUM(wb.pending_amount_minor)::text AS pending_amount_minor,
          COUNT(DISTINCT w.id) FILTER (WHERE w.status = 'active')::int AS active_wallet_count,
          (
            SELECT COUNT(*)::int
            FROM user_transactions ut
            WHERE ut.currency = wb.currency
              AND ut.posted_at IS NOT NULL
              AND ut.posted_at >= CURRENT_DATE
              AND ut.posted_at < CURRENT_DATE + INTERVAL '1 day'
          ) AS posted_today
        FROM wallet_balances wb
        JOIN wallets w
          ON w.id = wb.wallet_id
        GROUP BY wb.currency
        ORDER BY wb.currency ASC
      `,
    );

    return result.rows.map((row) => ({
      activeWalletCount: Number(row.active_wallet_count),
      availableAmountMinor: row.available_amount_minor,
      currency: row.currency,
      pendingAmountMinor: row.pending_amount_minor,
      postedToday: Number(row.posted_today),
    }));
  }

  async listWallets(): Promise<AdminWalletListItemView[]> {
    const walletsResult = await this.databaseService.query<AdminWalletRow>(
      `
        SELECT
          w.id::text AS wallet_id,
          w.label AS wallet_label,
          w.status AS wallet_status,
          w.opened_at,
          w.closed_at,
          u.id::text AS customer_id,
          u.external_ref AS customer_external_ref,
          COALESCE(
            MAX(COALESCE(ut.posted_at, ut.occurred_at)),
            MAX(wb.updated_at),
            w.updated_at
          ) AS last_movement_at
        FROM wallets w
        JOIN users u
          ON u.id = w.user_id
        LEFT JOIN wallet_balances wb
          ON wb.wallet_id = w.id
        LEFT JOIN user_transactions ut
          ON ut.wallet_id = w.id
        GROUP BY w.id, u.id
        ORDER BY last_movement_at DESC NULLS LAST, w.created_at DESC, w.id DESC
      `,
    );

    const balancesResult = await this.databaseService.query<AdminWalletBalanceRow>(
      `
        SELECT
          wb.wallet_id::text AS wallet_id,
          wb.currency,
          wb.available_amount_minor::text AS available_amount_minor,
          wb.pending_amount_minor::text AS pending_amount_minor,
          wb.updated_at
        FROM wallet_balances wb
        ORDER BY wb.wallet_id ASC, wb.currency ASC
      `,
    );

    const balancesByWallet = new Map<string, AdminWalletBalanceView[]>();

    for (const row of balancesResult.rows) {
      const current = balancesByWallet.get(row.wallet_id) ?? [];
      current.push({
        availableAmountMinor: row.available_amount_minor,
        currency: row.currency,
        pendingAmountMinor: row.pending_amount_minor,
        updatedAt: row.updated_at,
      });
      balancesByWallet.set(row.wallet_id, current);
    }

    return walletsResult.rows.map((row) => ({
      balances: balancesByWallet.get(row.wallet_id) ?? [],
      closedAt: row.closed_at,
      customerExternalRef: row.customer_external_ref,
      customerId: row.customer_id,
      lastMovementAt: row.last_movement_at,
      openedAt: row.opened_at,
      walletId: row.wallet_id,
      walletLabel: row.wallet_label,
      walletStatus: row.wallet_status,
    }));
  }
}
