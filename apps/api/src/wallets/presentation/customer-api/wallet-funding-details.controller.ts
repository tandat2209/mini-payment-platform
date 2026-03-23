import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';

import { CurrentCustomer } from '../../../access/customer/current-customer.decorator';
import { CurrentCustomerGuard } from '../../../access/customer/current-customer.guard';
import { type CurrentCustomer as CurrentCustomerView } from '../../../access/customer/current-customer.types';
import { toIsoTimestamp } from '../../../shared/api/api-primitives';
import { GetWalletFundingDetailsQuery } from '../../application/queries/get-wallet-funding-details.query';

type WalletFundingDetailResponse = {
  currency: string;
  details: Record<string, unknown>;
  id: string;
  rail: string;
  updatedAt: string | null;
};

type WalletFundingDetailsResponse = {
  fundingDetails: WalletFundingDetailResponse[];
  wallet: {
    id: string;
    status: string;
  };
};

@UseGuards(CurrentCustomerGuard)
@Controller('customers/me/funding-details')
export class WalletFundingDetailsController {
  constructor(private readonly getWalletFundingDetailsQuery: GetWalletFundingDetailsQuery) {}

  @Get()
  async getFundingDetails(
    @CurrentCustomer() customer: CurrentCustomerView,
  ): Promise<WalletFundingDetailsResponse> {
    const fundingDetails = await this.getWalletFundingDetailsQuery.execute(customer);

    if (!fundingDetails) {
      throw new NotFoundException('Active wallet not found');
    }

    return {
      fundingDetails: fundingDetails.fundingDetails.map((detail) => ({
        currency: detail.currency,
        details: detail.details,
        id: detail.id,
        rail: detail.rail,
        updatedAt: toIsoTimestamp(detail.updatedAt),
      })),
      wallet: {
        id: fundingDetails.walletId,
        status: fundingDetails.walletStatus,
      },
    };
  }
}
