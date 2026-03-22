import { Module } from '@nestjs/common';

import { GetWalletBalancesQuery } from './application/queries/get-wallet-balances.query';
import { WALLET_BALANCE_QUERY_REPOSITORY } from './domain/wallet-balance-query.repository';
import { SqlWalletBalanceQueryRepository } from './infrastructure/sql-wallet-balance-query.repository';
import { WalletBalancesController } from './presentation/customer-api/wallet-balances.controller';

@Module({
  controllers: [WalletBalancesController],
  providers: [
    GetWalletBalancesQuery,
    SqlWalletBalanceQueryRepository,
    {
      provide: WALLET_BALANCE_QUERY_REPOSITORY,
      useExisting: SqlWalletBalanceQueryRepository,
    },
  ],
})
export class WalletsModule {}
