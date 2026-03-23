export type WalletFundingDetailItemView = {
  currency: string;
  details: Record<string, unknown>;
  id: string;
  rail: string;
  updatedAt: Date | string | null;
};

export type WalletFundingDetailsView = {
  fundingDetails: WalletFundingDetailItemView[];
  walletId: string;
  walletStatus: string;
};

export interface WalletFundingDetailsQueryRepository {
  getActiveWalletFundingDetails(customerId: string): Promise<WalletFundingDetailsView | null>;
}

export const WALLET_FUNDING_DETAILS_QUERY_REPOSITORY = Symbol(
  'WALLET_FUNDING_DETAILS_QUERY_REPOSITORY',
);
