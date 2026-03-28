import { Controller, Get } from '@nestjs/common';

import { toIsoTimestamp, toMoneyDto } from '../../../shared/api/api-primitives';
import { GetAdminWalletsQuery } from '../../application/queries/get-admin-wallets.query';

@Controller('admin')
export class AdminWalletsController {
  constructor(private readonly getAdminWalletsQuery: GetAdminWalletsQuery) {}

  @Get('balances')
  async listBalanceSummaries(): Promise<{
    items: Array<{
      activeWalletCount: number;
      accountingIntegrity: {
        isBalanced: boolean;
        trialBalanceDelta: ReturnType<typeof toMoneyDto>;
        unbalancedJournalCount: number;
      };
      available: ReturnType<typeof toMoneyDto>;
      businessIntegrity: {
        cashCoverageGap: ReturnType<typeof toMoneyDto>;
        inFlightGross: ReturnType<typeof toMoneyDto>;
        inFlightNet: ReturnType<typeof toMoneyDto>;
        inFlightPayoutCount: number;
        isHealthy: boolean;
        issues: Array<{
          code: string;
          count: number | null;
          severity: 'high' | 'medium';
          summary: string;
          value: ReturnType<typeof toMoneyDto> | null;
        }>;
        walletExposure: ReturnType<typeof toMoneyDto>;
        walletExposureMismatch: ReturnType<typeof toMoneyDto>;
      };
      currency: string;
      pending: ReturnType<typeof toMoneyDto>;
      positions: {
        platformCash: ReturnType<typeof toMoneyDto>;
        platformRevenue: ReturnType<typeof toMoneyDto>;
        recipientPayables: ReturnType<typeof toMoneyDto>;
        walletLiabilities: ReturnType<typeof toMoneyDto>;
      };
      postedToday: number;
    }>;
  }> {
    const items = await this.getAdminWalletsQuery.listBalances();

    return {
      items: items.map((item) => ({
        activeWalletCount: item.activeWalletCount,
        accountingIntegrity: {
          isBalanced: item.accountingIntegrity.isBalanced,
          trialBalanceDelta: toMoneyDto(
            item.currency,
            item.accountingIntegrity.trialBalanceDeltaAmountMinor,
          ),
          unbalancedJournalCount: item.accountingIntegrity.unbalancedJournalCount,
        },
        available: toMoneyDto(item.currency, item.availableAmountMinor),
        businessIntegrity: {
          cashCoverageGap: toMoneyDto(
            item.currency,
            item.businessIntegrity.cashCoverageGapAmountMinor,
          ),
          inFlightGross: toMoneyDto(item.currency, item.businessIntegrity.inFlightGrossAmountMinor),
          inFlightNet: toMoneyDto(item.currency, item.businessIntegrity.inFlightNetAmountMinor),
          inFlightPayoutCount: item.businessIntegrity.inFlightPayoutCount,
          isHealthy: item.businessIntegrity.isHealthy,
          issues: item.businessIntegrity.issues.map((issue) => ({
            code: issue.code,
            count: issue.count,
            severity: issue.severity,
            summary: issue.summary,
            value: issue.valueAmountMinor
              ? toMoneyDto(item.currency, issue.valueAmountMinor)
              : null,
          })),
          walletExposure: toMoneyDto(
            item.currency,
            item.businessIntegrity.walletExposureAmountMinor,
          ),
          walletExposureMismatch: toMoneyDto(
            item.currency,
            item.businessIntegrity.walletExposureMismatchAmountMinor,
          ),
        },
        currency: item.currency,
        pending: toMoneyDto(item.currency, item.pendingAmountMinor),
        positions: {
          platformCash: toMoneyDto(item.currency, item.positions.platformCashAmountMinor),
          platformRevenue: toMoneyDto(item.currency, item.positions.platformRevenueAmountMinor),
          recipientPayables: toMoneyDto(item.currency, item.positions.recipientPayablesAmountMinor),
          walletLiabilities: toMoneyDto(item.currency, item.positions.walletLiabilitiesAmountMinor),
        },
        postedToday: item.postedToday,
      })),
    };
  }

  @Get('wallets')
  async listWallets(): Promise<{
    items: Array<{
      balances: Array<{
        available: ReturnType<typeof toMoneyDto>;
        currency: string;
        pending: ReturnType<typeof toMoneyDto>;
        updatedAt: string | null;
      }>;
      closedAt: string | null;
      customer: {
        externalRef: string;
        id: string;
      };
      lastMovementAt: string | null;
      openedAt: string | null;
      status: string;
      wallet: {
        id: string;
        label: string | null;
      };
    }>;
  }> {
    const items = await this.getAdminWalletsQuery.listWallets();

    return {
      items: items.map((item) => ({
        balances: item.balances.map((balance) => ({
          available: toMoneyDto(balance.currency, balance.availableAmountMinor),
          currency: balance.currency,
          pending: toMoneyDto(balance.currency, balance.pendingAmountMinor),
          updatedAt: toIsoTimestamp(balance.updatedAt),
        })),
        closedAt: toIsoTimestamp(item.closedAt),
        customer: {
          externalRef: item.customerExternalRef,
          id: item.customerId,
        },
        lastMovementAt: toIsoTimestamp(item.lastMovementAt),
        openedAt: toIsoTimestamp(item.openedAt),
        status: item.walletStatus,
        wallet: {
          id: item.walletId,
          label: item.walletLabel,
        },
      })),
    };
  }
}
