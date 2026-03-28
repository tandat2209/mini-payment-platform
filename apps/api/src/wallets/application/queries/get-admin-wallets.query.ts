import { Inject, Injectable } from '@nestjs/common';

import {
  ADMIN_WALLET_QUERY_REPOSITORY,
  type AdminWalletBalanceSummaryView,
  type AdminWalletListItemView,
  type AdminWalletQueryRepository,
} from '../../domain/admin-wallet-query.repository';

@Injectable()
export class GetAdminWalletsQuery {
  constructor(
    @Inject(ADMIN_WALLET_QUERY_REPOSITORY)
    private readonly adminWalletQueryRepository: AdminWalletQueryRepository,
  ) {}

  async listBalances(): Promise<AdminWalletBalanceSummaryView[]> {
    return await this.adminWalletQueryRepository.listBalanceSummaries();
  }

  async listWallets(): Promise<AdminWalletListItemView[]> {
    return await this.adminWalletQueryRepository.listWallets();
  }
}
