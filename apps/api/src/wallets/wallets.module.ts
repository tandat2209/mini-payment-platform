import { Module } from '@nestjs/common';

import { GetAdminWalletsQuery } from './application/queries/get-admin-wallets.query';
import { GetWalletBalancesQuery } from './application/queries/get-wallet-balances.query';
import { GetWalletFundingDetailsQuery } from './application/queries/get-wallet-funding-details.query';
import { ADMIN_WALLET_QUERY_REPOSITORY } from './domain/admin-wallet-query.repository';
import { WALLET_BALANCE_QUERY_REPOSITORY } from './domain/wallet-balance-query.repository';
import { WALLET_FUNDING_DETAILS_QUERY_REPOSITORY } from './domain/wallet-funding-details-query.repository';
import { SqlAdminWalletQueryRepository } from './infrastructure/sql-admin-wallet-query.repository';
import { SqlWalletBalanceQueryRepository } from './infrastructure/sql-wallet-balance-query.repository';
import { SqlWalletFundingDetailsQueryRepository } from './infrastructure/sql-wallet-funding-details-query.repository';
import { AdminWalletsController } from './presentation/admin-api/admin-wallets.controller';
import { WalletBalancesController } from './presentation/customer-api/wallet-balances.controller';
import { WalletFundingDetailsController } from './presentation/customer-api/wallet-funding-details.controller';

@Module({
  controllers: [AdminWalletsController, WalletBalancesController, WalletFundingDetailsController],
  providers: [
    GetAdminWalletsQuery,
    GetWalletBalancesQuery,
    GetWalletFundingDetailsQuery,
    SqlAdminWalletQueryRepository,
    SqlWalletBalanceQueryRepository,
    SqlWalletFundingDetailsQueryRepository,
    {
      provide: ADMIN_WALLET_QUERY_REPOSITORY,
      useExisting: SqlAdminWalletQueryRepository,
    },
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
