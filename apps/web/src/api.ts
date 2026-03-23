import { getJson } from './lib/api-client';

type HealthResponse = {
  service: string;
  status: string;
  timestamp: string;
};

type MoneyDto = {
  amountMinor: string;
  currency: string;
};

type WalletBalance = {
  available: MoneyDto;
  currency: string;
  pending: MoneyDto;
  updatedAt: string | null;
};

type FundingDetailValue = boolean | number | string | null;

type WalletFundingDetail = {
  currency: string;
  details: Record<string, FundingDetailValue>;
  id: string;
  rail: string;
  updatedAt: string | null;
};

type WalletBalancesResponse = {
  balances: WalletBalance[];
  wallet: {
    id: string;
    status: string;
  };
};

type WalletFundingDetailsResponse = {
  fundingDetails: WalletFundingDetail[];
  wallet: {
    id: string;
    status: string;
  };
};

type TransactionItem = {
  amounts: {
    fee: MoneyDto;
    gross: MoneyDto;
    net: MoneyDto;
  };
  currency: string;
  description: string;
  direction: string;
  id: string;
  occurredAt: string | null;
  postedAt: string | null;
  reference: string | null;
  status: string;
  type: string;
};

type TransactionDetailItem = TransactionItem & {
  payout: {
    payoutId: string;
    payoutReference: string | null;
    recipientId: string | null;
    recipientName: string | null;
  } | null;
};

type TransactionListResponse = {
  items: TransactionItem[];
  page: {
    limit: number;
    nextCursor: string | null;
  };
};

type RecipientSummary = {
  createdAt: string | null;
  id: string;
  name: string;
  rails: Array<{
    currency: string | null;
    id: string;
    isDefault: boolean;
    rail: string;
  }>;
  status: string;
};

type RecipientListResponse = {
  items: RecipientSummary[];
};

type StatementPeriod = {
  currency: string;
  month: number;
  walletId: string;
  year: number;
};

type StatementPeriodListResponse = {
  items: StatementPeriod[];
};

type StatementDetailResponse = {
  closingBalance: MoneyDto;
  currency: string;
  lineItems: TransactionItem[];
  month: number;
  openingBalance: MoneyDto;
  totals: {
    credits: MoneyDto;
    debits: MoneyDto;
  };
  walletId: string;
  year: number;
};

type StatementOverviewData = {
  detailError: string | null;
  items: StatementPeriod[];
  latestDetail: StatementDetailResponse | null;
  latestPeriod: StatementPeriod | null;
};

function getErrorMessage(caughtError: unknown): string {
  return caughtError instanceof Error ? caughtError.message : 'Unknown error';
}

function sortStatementPeriods(periods: StatementPeriod[]): StatementPeriod[] {
  return [...periods].sort((left, right) => {
    if (left.year !== right.year) {
      return right.year - left.year;
    }

    if (left.month !== right.month) {
      return right.month - left.month;
    }

    return left.currency.localeCompare(right.currency);
  });
}

export async function fetchHealth(): Promise<HealthResponse> {
  return await getJson<HealthResponse>('/health', {
    errorLabel: 'Health request',
    includeCustomerContext: false,
  });
}

export async function fetchBalances(): Promise<WalletBalancesResponse> {
  return await getJson<WalletBalancesResponse>('/customers/me/balances', {
    errorLabel: 'Balance request',
  });
}

export async function fetchFundingDetails(): Promise<WalletFundingDetailsResponse> {
  return await getJson<WalletFundingDetailsResponse>('/customers/me/funding-details', {
    errorLabel: 'Funding details request',
  });
}

export async function fetchTransactions(limit: number): Promise<TransactionListResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  return await getJson<TransactionListResponse>(`/customers/me/transactions?${params.toString()}`, {
    errorLabel: 'Transaction request',
  });
}

export async function fetchTransactionDetail(
  transactionId: string,
): Promise<TransactionDetailItem> {
  return await getJson<TransactionDetailItem>(`/customers/me/transactions/${transactionId}`, {
    errorLabel: 'Transaction detail request',
  });
}

export async function fetchRecipients(): Promise<RecipientListResponse> {
  return await getJson<RecipientListResponse>('/customers/me/recipients', {
    errorLabel: 'Recipient request',
  });
}

export async function fetchStatementPeriods(): Promise<StatementPeriodListResponse> {
  return await getJson<StatementPeriodListResponse>('/customers/me/statements', {
    errorLabel: 'Statement period request',
  });
}

export async function fetchStatementDetail(
  period: StatementPeriod,
): Promise<StatementDetailResponse> {
  return await getJson<StatementDetailResponse>(
    `/customers/me/statements/${period.walletId}/${period.currency}/${period.year}/${period.month}`,
    {
      errorLabel: 'Statement detail request',
    },
  );
}

export async function fetchStatementOverview(): Promise<StatementOverviewData> {
  const periodResponse = await fetchStatementPeriods();
  const items = sortStatementPeriods(periodResponse.items);
  const latestPeriod = items[0] ?? null;

  if (!latestPeriod) {
    return {
      detailError: null,
      items,
      latestDetail: null,
      latestPeriod: null,
    };
  }

  try {
    const latestDetail = await fetchStatementDetail(latestPeriod);

    return {
      detailError: null,
      items,
      latestDetail,
      latestPeriod,
    };
  } catch (caughtError) {
    return {
      detailError: getErrorMessage(caughtError),
      items,
      latestDetail: null,
      latestPeriod,
    };
  }
}

export type {
  FundingDetailValue,
  HealthResponse,
  MoneyDto,
  RecipientListResponse,
  RecipientSummary,
  StatementDetailResponse,
  StatementOverviewData,
  StatementPeriod,
  TransactionDetailItem,
  TransactionItem,
  TransactionListResponse,
  WalletBalance,
  WalletBalancesResponse,
  WalletFundingDetail,
  WalletFundingDetailsResponse,
};

export { getApiBaseUrl, getCustomerExternalRef } from './lib/runtime-env';
