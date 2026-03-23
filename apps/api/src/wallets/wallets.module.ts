import { Module } from '@nestjs/common';

import { GetWalletBalancesQuery } from './application/queries/get-wallet-balances.query';
import { GetWalletFundingDetailsQuery } from './application/queries/get-wallet-funding-details.query';
import { WALLET_BALANCE_QUERY_REPOSITORY } from './domain/wallet-balance-query.repository';
import { WALLET_FUNDING_DETAILS_QUERY_REPOSITORY } from './domain/wallet-funding-details-query.repository';
import { SqlWalletBalanceQueryRepository } from './infrastructure/sql-wallet-balance-query.repository';
import { SqlWalletFundingDetailsQueryRepository } from './infrastructure/sql-wallet-funding-details-query.repository';
import { WalletBalancesController } from './presentation/customer-api/wallet-balances.controller';
import { WalletFundingDetailsController } from './presentation/customer-api/wallet-funding-details.controller';

@Module({
  controllers: [WalletBalancesController, WalletFundingDetailsController],
  providers: [
    GetWalletBalancesQuery,
    GetWalletFundingDetailsQuery,
    SqlWalletBalanceQueryRepository,
    SqlWalletFundingDetailsQueryRepository,
    {
      provide: WALLET_BALANCE_QUERY_REPOSITORY,
      useExisting: SqlWalletBalanceQueryRepository,
    },
    {
      provide: WALLET_FUNDING_DETAILS_QUERY_REPOSITORY,
      useExisting: SqlWalletFundingDetailsQueryRepository,
    },
  ],
})
export class WalletsModule {}
