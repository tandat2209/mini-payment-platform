import { Inject, Injectable } from '@nestjs/common';

import { type CurrentCustomer } from '../../../access/customer/current-customer.types';
import {
  WALLET_BALANCE_QUERY_REPOSITORY,
  type WalletBalanceQueryRepository,
} from '../../domain/wallet-balance-query.repository';

@Injectable()
export class GetWalletBalancesQuery {
  constructor(
    @Inject(WALLET_BALANCE_QUERY_REPOSITORY)
    private readonly walletBalanceQueryRepository: WalletBalanceQueryRepository,
  ) {}

  execute(
    customer: CurrentCustomer,
  ): ReturnType<WalletBalanceQueryRepository['getActiveWalletBalances']> {
    return this.walletBalanceQueryRepository.getActiveWalletBalances(customer.id);
  }
}
