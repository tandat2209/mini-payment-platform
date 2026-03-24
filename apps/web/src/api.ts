import { getJson, postJsonToBase } from './lib/api-client';
import { getPspSandboxBaseUrl } from './lib/runtime-env';

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

type SandboxFundingRequest = {
  amountMinor: number;
  currency: string;
  description?: string;
  destinationIdentifier: string;
  destinationType: 'account_number' | 'iban' | 'virtual_account';
  externalEventId?: string;
  providerReference?: string;
  sender?: {
    accountIdentifier?: string;
    bankCode?: string;
    bankName?: string;
    name: string;
  };
};

type SandboxFundingResponse = {
  deliveryTarget: string;
  delivered: true;
  externalEventId: string;
  payload: {
    data: SandboxFundingRequest;
    eventType: 'funding.completed';
    externalEventId: string;
    occurredAt: string;
    provider: string;
  };
  receiverResponse: Record<string, unknown>;
};

type AdminTransactionItem = {
  amounts: {
    fee: MoneyDto;
    gross: MoneyDto;
    net: MoneyDto;
  };
  currency: string;
  customer: {
    externalRef: string;
    id: string;
  };
  description: string;
  direction: string;
  id: string;
  occurredAt: string | null;
  postedAt: string | null;
  reference: string | null;
  status: string;
  type: string;
  walletId: string;
  webhookEventId: string | null;
};

type AdminTransactionDetailItem = AdminTransactionItem & {
  linkedLedgers: Array<{
    description: string | null;
    id: string;
    postedAt: string | null;
    reference: string | null;
    status: string;
    transactionType: string;
  }>;
  payout: {
    payoutId: string;
    payoutReference: string | null;
    recipientId: string | null;
    recipientName: string | null;
  } | null;
};

type AdminTransactionListResponse = {
  items: AdminTransactionItem[];
  page: {
    limit: number;
    nextCursor: string | null;
  };
};

type AdminLedgerItem = {
  credits: MoneyDto;
  currency: string;
  debits: MoneyDto;
  description: string | null;
  entryCount: number;
  id: string;
  integrity: {
    delta: MoneyDto;
    isBalanced: boolean;
  };
  postedAt: string | null;
  reference: string | null;
  status: string;
  transactionType: string;
  userTransactionId: string | null;
  webhookEventId: string | null;
};

type AdminLedgerDetailItem = AdminLedgerItem & {
  entries: Array<{
    account: {
      code: string;
      id: string;
      name: string;
      ownerId: string | null;
      ownerType: string | null;
      type: string;
    };
    amount: MoneyDto;
    description: string | null;
    direction: string;
    id: string;
  }>;
};

type AdminLedgerListResponse = {
  items: AdminLedgerItem[];
  page: {
    limit: number;
    nextCursor: string | null;
  };
  summary: {
    accountGroupSummaries: Array<{
      accountCount: number;
      accountGroup: string;
      credits: MoneyDto;
      currency: string;
      debits: MoneyDto;
      description: string;
      net: MoneyDto;
    }>;
    currencySummaries: Array<{
      credits: MoneyDto;
      currency: string;
      debits: MoneyDto;
      delta: MoneyDto;
    }>;
    trialBalanceRows: Array<{
      accountCode: string;
      accountGroup: string;
      accountName: string;
      accountType: string;
      credits: MoneyDto;
      currency: string;
      debits: MoneyDto;
      net: MoneyDto;
    }>;
    unbalancedTransactions: number;
  };
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

export async function triggerSandboxFundingSimulation(
  request: SandboxFundingRequest,
): Promise<SandboxFundingResponse> {
  return await postJsonToBase<SandboxFundingResponse, SandboxFundingRequest>(
    getPspSandboxBaseUrl(),
    '/simulate/funding',
    request,
    {
      errorLabel: 'PSP sandbox request',
      includeCustomerContext: false,
    },
  );
}

export async function fetchAdminTransactions(input: {
  cursor?: string | null;
  limit: number;
  query?: string;
  type?: string | null;
}): Promise<AdminTransactionListResponse> {
  const params = new URLSearchParams({
    limit: String(input.limit),
  });

  if (input.cursor) {
    params.set('cursor', input.cursor);
  }

  if (input.query) {
    params.set('query', input.query);
  }

  if (input.type) {
    params.set('type', input.type);
  }

  return await getJson<AdminTransactionListResponse>(`/admin/transactions?${params.toString()}`, {
    errorLabel: 'Admin transactions request',
    includeCustomerContext: false,
  });
}

export async function fetchAdminTransactionDetail(
  transactionId: string,
): Promise<AdminTransactionDetailItem> {
  return await getJson<AdminTransactionDetailItem>(`/admin/transactions/${transactionId}`, {
    errorLabel: 'Admin transaction detail request',
    includeCustomerContext: false,
  });
}

export async function fetchAdminLedgers(input: {
  cursor?: string | null;
  limit: number;
  query?: string;
  transactionType?: string | null;
}): Promise<AdminLedgerListResponse> {
  const params = new URLSearchParams({
    limit: String(input.limit),
  });

  if (input.cursor) {
    params.set('cursor', input.cursor);
  }

  if (input.query) {
    params.set('query', input.query);
  }

  if (input.transactionType) {
    params.set('transactionType', input.transactionType);
  }

  return await getJson<AdminLedgerListResponse>(`/admin/ledgers?${params.toString()}`, {
    errorLabel: 'Admin ledgers request',
    includeCustomerContext: false,
  });
}

export async function fetchAdminLedgerDetail(
  ledgerTransactionId: string,
): Promise<AdminLedgerDetailItem> {
  return await getJson<AdminLedgerDetailItem>(`/admin/ledgers/${ledgerTransactionId}`, {
    errorLabel: 'Admin ledger detail request',
    includeCustomerContext: false,
  });
}

export type {
  AdminLedgerDetailItem,
  AdminLedgerItem,
  AdminLedgerListResponse,
  AdminTransactionDetailItem,
  AdminTransactionItem,
  AdminTransactionListResponse,
  FundingDetailValue,
  HealthResponse,
  MoneyDto,
  RecipientListResponse,
  RecipientSummary,
  SandboxFundingRequest,
  SandboxFundingResponse,
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

export { getApiBaseUrl, getCustomerExternalRef, getPspSandboxBaseUrl } from './lib/runtime-env';
