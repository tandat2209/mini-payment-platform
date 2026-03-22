import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';

import { CurrentCustomer } from '../../../access/customer/current-customer.decorator';
import { CurrentCustomerGuard } from '../../../access/customer/current-customer.guard';
import { type CurrentCustomer as CurrentCustomerView } from '../../../access/customer/current-customer.types';
import { toIsoTimestamp, toMoneyDto } from '../../../shared/api/api-primitives';
import { GetWalletBalancesQuery } from '../../application/queries/get-wallet-balances.query';

type WalletBalanceResponse = {
  available: ReturnType<typeof toMoneyDto>;
  currency: string;
  pending: ReturnType<typeof toMoneyDto>;
  updatedAt: string | null;
};

type WalletBalancesResponse = {
  balances: WalletBalanceResponse[];
  wallet: {
    id: string;
    status: string;
  };
};

@UseGuards(CurrentCustomerGuard)
@Controller('customers/me/balances')
export class WalletBalancesController {
  constructor(private readonly getWalletBalancesQuery: GetWalletBalancesQuery) {}

  @Get()
  async getBalances(
    @CurrentCustomer() customer: CurrentCustomerView,
  ): Promise<WalletBalancesResponse> {
    const balances = await this.getWalletBalancesQuery.execute(customer);

    if (!balances) {
      throw new NotFoundException('Active wallet not found');
    }

    return {
      balances: balances.balances.map((balance) => ({
        available: toMoneyDto(balance.currency, balance.availableAmountMinor),
        currency: balance.currency,
        pending: toMoneyDto(balance.currency, balance.pendingAmountMinor),
        updatedAt: toIsoTimestamp(balance.updatedAt),
      })),
      wallet: {
        id: balances.walletId,
        status: balances.walletStatus,
      },
    };
  }
}
