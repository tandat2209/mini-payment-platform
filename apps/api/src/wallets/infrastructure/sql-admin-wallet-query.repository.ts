import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import { getLedgerAccountGroup } from '../../ledger/domain/admin-ledger-account-group';
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
  negative_available_wallet_count: number | string;
  negative_pending_wallet_count: number | string;
  pending_amount_minor: string;
  posted_today: number | string;
  wallet_exposure_amount_minor: string;
};

type AdminLedgerPositionRow = {
  account_code: string;
  account_type: string;
  credit_amount_minor: string;
  currency: string;
  debit_amount_minor: string;
};

type AdminLedgerCurrencySummaryRow = {
  currency: string;
  delta_amount_minor: string;
};

type AdminLedgerUnbalancedRow = {
  currency: string;
  unbalanced_journal_count: number | string;
};

type AdminPayoutIntegrityRow = {
  currency: string;
  in_flight_gross_amount_minor: string;
  in_flight_net_amount_minor: string;
  in_flight_payout_count: number | string;
};

@Injectable()
export class SqlAdminWalletQueryRepository implements AdminWalletQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listBalanceSummaries(): Promise<AdminWalletBalanceSummaryView[]> {
    const [
      balanceResult,
      ledgerPositionsResult,
      ledgerDeltaResult,
      unbalancedResult,
      payoutResult,
    ] = await Promise.all([
      this.databaseService.query<AdminWalletBalanceSummaryRow>(
        `
            SELECT
              wb.currency,
              SUM(wb.available_amount_minor)::text AS available_amount_minor,
              SUM(wb.pending_amount_minor)::text AS pending_amount_minor,
              SUM(wb.available_amount_minor + wb.pending_amount_minor)::text AS wallet_exposure_amount_minor,
              COUNT(DISTINCT w.id) FILTER (WHERE w.status = 'active')::int AS active_wallet_count,
              COUNT(*) FILTER (WHERE wb.available_amount_minor < 0)::int AS negative_available_wallet_count,
              COUNT(*) FILTER (WHERE wb.pending_amount_minor < 0)::int AS negative_pending_wallet_count,
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
      ),
      this.databaseService.query<AdminLedgerPositionRow>(
        `
            SELECT
              la.code AS account_code,
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
            FROM ledger_entries le
            JOIN ledger_accounts la
              ON la.id = le.ledger_account_id
            GROUP BY la.code, la.account_type, le.currency
            ORDER BY le.currency ASC, la.code ASC
          `,
      ),
      this.databaseService.query<AdminLedgerCurrencySummaryRow>(
        `
            SELECT
              lt.currency,
              (
                COALESCE(
                  SUM(CASE WHEN le.direction = 'debit' THEN le.amount_minor ELSE 0 END),
                  0
                ) - COALESCE(
                  SUM(CASE WHEN le.direction = 'credit' THEN le.amount_minor ELSE 0 END),
                  0
                )
              )::text AS delta_amount_minor
            FROM ledger_transactions lt
            LEFT JOIN ledger_entries le
              ON le.ledger_transaction_id = lt.id
            GROUP BY lt.currency
            ORDER BY lt.currency ASC
          `,
      ),
      this.databaseService.query<AdminLedgerUnbalancedRow>(
        `
            SELECT
              transaction_totals.currency,
              COUNT(*)::int AS unbalanced_journal_count
            FROM (
              SELECT
                lt.id,
                lt.currency,
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
              GROUP BY lt.id, lt.currency
            ) transaction_totals
            WHERE transaction_totals.debit_total <> transaction_totals.credit_total
            GROUP BY transaction_totals.currency
          `,
      ),
      this.databaseService.query<AdminPayoutIntegrityRow>(
        `
            SELECT
              p.currency,
              COUNT(*)::int AS in_flight_payout_count,
              COALESCE(SUM(p.gross_amount_minor), 0)::text AS in_flight_gross_amount_minor,
              COALESCE(SUM(p.net_amount_minor), 0)::text AS in_flight_net_amount_minor
            FROM payouts p
            WHERE p.status IN ('pending_submission', 'submitted', 'processing')
            GROUP BY p.currency
            ORDER BY p.currency ASC
          `,
      ),
    ]);

    const ledgerPositionsByCurrency = new Map<
      string,
      {
        platformCashAmountMinor: bigint;
        platformRevenueAmountMinor: bigint;
        recipientPayablesAmountMinor: bigint;
        walletLiabilitiesAmountMinor: bigint;
      }
    >();

    for (const row of ledgerPositionsResult.rows) {
      const currencyState = ledgerPositionsByCurrency.get(row.currency) ?? {
        platformCashAmountMinor: 0n,
        platformRevenueAmountMinor: 0n,
        recipientPayablesAmountMinor: 0n,
        walletLiabilitiesAmountMinor: 0n,
      };
      const balanceMinor = this.getNormalizedLedgerBalanceMinor(
        row.debit_amount_minor,
        row.credit_amount_minor,
        row.account_type,
      );

      switch (getLedgerAccountGroup(row.account_code)) {
        case 'Platform cash':
          currencyState.platformCashAmountMinor += balanceMinor;
          break;
        case 'Platform revenue':
          currencyState.platformRevenueAmountMinor += balanceMinor;
          break;
        case 'Recipient payables':
          currencyState.recipientPayablesAmountMinor += balanceMinor;
          break;
        case 'Wallet liabilities':
          currencyState.walletLiabilitiesAmountMinor += balanceMinor;
          break;
        default:
          break;
      }

      ledgerPositionsByCurrency.set(row.currency, currencyState);
    }

    const ledgerDeltaByCurrency = new Map(
      ledgerDeltaResult.rows.map((row) => [row.currency, BigInt(row.delta_amount_minor)]),
    );
    const unbalancedByCurrency = new Map(
      unbalancedResult.rows.map((row) => [row.currency, Number(row.unbalanced_journal_count)]),
    );
    const payoutIntegrityByCurrency = new Map(
      payoutResult.rows.map((row) => [
        row.currency,
        {
          inFlightGrossAmountMinor: BigInt(row.in_flight_gross_amount_minor),
          inFlightNetAmountMinor: BigInt(row.in_flight_net_amount_minor),
          inFlightPayoutCount: Number(row.in_flight_payout_count),
        },
      ]),
    );
    const currencies = new Set<string>([
      ...balanceResult.rows.map((row) => row.currency),
      ...ledgerPositionsByCurrency.keys(),
      ...ledgerDeltaByCurrency.keys(),
      ...payoutIntegrityByCurrency.keys(),
    ]);

    return [...currencies]
      .sort((left, right) => left.localeCompare(right))
      .map((currency) => {
        const balanceRow = balanceResult.rows.find((row) => row.currency === currency);
        const positions = ledgerPositionsByCurrency.get(currency) ?? {
          platformCashAmountMinor: 0n,
          platformRevenueAmountMinor: 0n,
          recipientPayablesAmountMinor: 0n,
          walletLiabilitiesAmountMinor: 0n,
        };
        const payoutIntegrity = payoutIntegrityByCurrency.get(currency) ?? {
          inFlightGrossAmountMinor: 0n,
          inFlightNetAmountMinor: 0n,
          inFlightPayoutCount: 0,
        };
        const walletExposureAmountMinor = BigInt(balanceRow?.wallet_exposure_amount_minor ?? '0');
        const walletExposureMismatchAmountMinor =
          walletExposureAmountMinor - positions.walletLiabilitiesAmountMinor;
        const recipientPayablesMismatchAmountMinor =
          positions.recipientPayablesAmountMinor - payoutIntegrity.inFlightNetAmountMinor;
        const cashCoverageGapAmountMinor = this.maxBigInt(
          0n,
          positions.walletLiabilitiesAmountMinor +
            positions.recipientPayablesAmountMinor -
            positions.platformCashAmountMinor,
        );
        const issues: AdminWalletBalanceSummaryView['businessIntegrity']['issues'] = [];
        const negativeAvailableWalletCount = Number(
          balanceRow?.negative_available_wallet_count ?? 0,
        );
        const negativePendingWalletCount = Number(balanceRow?.negative_pending_wallet_count ?? 0);

        if (positions.platformCashAmountMinor < 0n) {
          issues.push({
            code: 'platform_cash_negative',
            count: null,
            severity: 'high',
            summary: 'Platform cash is negative',
            valueAmountMinor: positions.platformCashAmountMinor.toString(),
          });
        }

        if (positions.walletLiabilitiesAmountMinor < 0n) {
          issues.push({
            code: 'wallet_liabilities_negative',
            count: null,
            severity: 'high',
            summary: 'Wallet liabilities are negative',
            valueAmountMinor: positions.walletLiabilitiesAmountMinor.toString(),
          });
        }

        if (positions.recipientPayablesAmountMinor < 0n) {
          issues.push({
            code: 'recipient_payables_negative',
            count: null,
            severity: 'high',
            summary: 'Recipient payables are negative',
            valueAmountMinor: positions.recipientPayablesAmountMinor.toString(),
          });
        }

        if (negativeAvailableWalletCount > 0) {
          issues.push({
            code: 'wallet_available_negative',
            count: negativeAvailableWalletCount,
            severity: 'high',
            summary: 'Wallet available balance is below zero',
            valueAmountMinor: null,
          });
        }

        if (negativePendingWalletCount > 0) {
          issues.push({
            code: 'wallet_pending_negative',
            count: negativePendingWalletCount,
            severity: 'high',
            summary: 'Wallet pending balance is below zero',
            valueAmountMinor: null,
          });
        }

        if (walletExposureMismatchAmountMinor !== 0n) {
          issues.push({
            code: 'wallet_exposure_mismatch',
            count: null,
            severity: 'high',
            summary: 'Wallet balances do not match wallet liability ledger',
            valueAmountMinor: walletExposureMismatchAmountMinor.toString(),
          });
        }

        if (recipientPayablesMismatchAmountMinor !== 0n) {
          issues.push({
            code: 'recipient_payables_mismatch',
            count: null,
            severity: 'medium',
            summary: 'Recipient payables do not match in-flight payouts',
            valueAmountMinor: recipientPayablesMismatchAmountMinor.toString(),
          });
        }

        if (cashCoverageGapAmountMinor > 0n) {
          issues.push({
            code: 'cash_coverage_gap',
            count: null,
            severity: 'high',
            summary: 'Platform cash does not cover current obligations',
            valueAmountMinor: cashCoverageGapAmountMinor.toString(),
          });
        }

        const trialBalanceDeltaAmountMinor = ledgerDeltaByCurrency.get(currency) ?? 0n;
        const unbalancedJournalCount = unbalancedByCurrency.get(currency) ?? 0;

        return {
          activeWalletCount: Number(balanceRow?.active_wallet_count ?? 0),
          accountingIntegrity: {
            isBalanced: trialBalanceDeltaAmountMinor === 0n && unbalancedJournalCount === 0,
            trialBalanceDeltaAmountMinor: trialBalanceDeltaAmountMinor.toString(),
            unbalancedJournalCount,
          },
          availableAmountMinor: balanceRow?.available_amount_minor ?? '0',
          businessIntegrity: {
            cashCoverageGapAmountMinor: cashCoverageGapAmountMinor.toString(),
            inFlightGrossAmountMinor: payoutIntegrity.inFlightGrossAmountMinor.toString(),
            inFlightNetAmountMinor: payoutIntegrity.inFlightNetAmountMinor.toString(),
            inFlightPayoutCount: payoutIntegrity.inFlightPayoutCount,
            isHealthy: issues.length === 0,
            issues,
            walletExposureAmountMinor: walletExposureAmountMinor.toString(),
            walletExposureMismatchAmountMinor: walletExposureMismatchAmountMinor.toString(),
          },
          currency,
          pendingAmountMinor: balanceRow?.pending_amount_minor ?? '0',
          positions: {
            platformCashAmountMinor: positions.platformCashAmountMinor.toString(),
            platformRevenueAmountMinor: positions.platformRevenueAmountMinor.toString(),
            recipientPayablesAmountMinor: positions.recipientPayablesAmountMinor.toString(),
            walletLiabilitiesAmountMinor: positions.walletLiabilitiesAmountMinor.toString(),
          },
          postedToday: Number(balanceRow?.posted_today ?? 0),
        };
      });
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

  private getNormalizedLedgerBalanceMinor(
    debitAmountMinor: string,
    creditAmountMinor: string,
    accountType: string,
  ): bigint {
    const debitMinor = BigInt(debitAmountMinor);
    const creditMinor = BigInt(creditAmountMinor);

    switch (accountType) {
      case 'asset':
      case 'expense':
        return debitMinor - creditMinor;
      default:
        return creditMinor - debitMinor;
    }
  }

  private maxBigInt(left: bigint, right: bigint): bigint {
    return left > right ? left : right;
  }
}
