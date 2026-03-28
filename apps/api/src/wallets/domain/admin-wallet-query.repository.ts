export type AdminWalletBalanceView = {
  availableAmountMinor: string;
  currency: string;
  pendingAmountMinor: string;
  updatedAt: Date | string | null;
};

export type AdminWalletListItemView = {
  balances: AdminWalletBalanceView[];
  closedAt: Date | string | null;
  customerExternalRef: string;
  customerId: string;
  lastMovementAt: Date | string | null;
  openedAt: Date | string | null;
  walletId: string;
  walletLabel: string | null;
  walletStatus: string;
};

export type AdminWalletBalanceSummaryView = {
  activeWalletCount: number;
  availableAmountMinor: string;
  businessIntegrity: {
    cashCoverageGapAmountMinor: string;
    inFlightPayoutCount: number;
    inFlightGrossAmountMinor: string;
    inFlightNetAmountMinor: string;
    isHealthy: boolean;
    issues: Array<{
      code: string;
      count: number | null;
      severity: 'high' | 'medium';
      summary: string;
      valueAmountMinor: string | null;
    }>;
    walletExposureAmountMinor: string;
    walletExposureMismatchAmountMinor: string;
  };
  currency: string;
  pendingAmountMinor: string;
  positions: {
    platformCashAmountMinor: string;
    platformRevenueAmountMinor: string;
    recipientPayablesAmountMinor: string;
    walletLiabilitiesAmountMinor: string;
  };
  postedToday: number;
  accountingIntegrity: {
    isBalanced: boolean;
    trialBalanceDeltaAmountMinor: string;
    unbalancedJournalCount: number;
  };
};

export interface AdminWalletQueryRepository {
  listBalanceSummaries(): Promise<AdminWalletBalanceSummaryView[]>;
  listWallets(): Promise<AdminWalletListItemView[]>;
}

export const ADMIN_WALLET_QUERY_REPOSITORY = Symbol('ADMIN_WALLET_QUERY_REPOSITORY');
