export type WalletBalanceItemView = {
  availableAmountMinor: string;
  currency: string;
  pendingAmountMinor: string;
  updatedAt: Date | string | null;
};

export type WalletBalanceView = {
  balances: WalletBalanceItemView[];
  walletId: string;
  walletStatus: string;
};

export interface WalletBalanceQueryRepository {
  getActiveWalletBalances(customerId: string): Promise<WalletBalanceView | null>;
}

export const WALLET_BALANCE_QUERY_REPOSITORY = Symbol('WALLET_BALANCE_QUERY_REPOSITORY');
