import { Inject, Injectable } from '@nestjs/common';

import { type CurrentCustomer } from '../../../access/customer/current-customer.types';
import {
  WALLET_FUNDING_DETAILS_QUERY_REPOSITORY,
  type WalletFundingDetailsQueryRepository,
} from '../../domain/wallet-funding-details-query.repository';

@Injectable()
export class GetWalletFundingDetailsQuery {
  constructor(
    @Inject(WALLET_FUNDING_DETAILS_QUERY_REPOSITORY)
    private readonly walletFundingDetailsQueryRepository: WalletFundingDetailsQueryRepository,
  ) {}

  execute(
    customer: CurrentCustomer,
  ): ReturnType<WalletFundingDetailsQueryRepository['getActiveWalletFundingDetails']> {
    return this.walletFundingDetailsQueryRepository.getActiveWalletFundingDetails(customer.id);
  }
}
