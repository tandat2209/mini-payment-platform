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
      available: ReturnType<typeof toMoneyDto>;
      currency: string;
      pending: ReturnType<typeof toMoneyDto>;
      postedToday: number;
    }>;
  }> {
    const items = await this.getAdminWalletsQuery.listBalances();

    return {
      items: items.map((item) => ({
        activeWalletCount: item.activeWalletCount,
        available: toMoneyDto(item.currency, item.availableAmountMinor),
        currency: item.currency,
        pending: toMoneyDto(item.currency, item.pendingAmountMinor),
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
