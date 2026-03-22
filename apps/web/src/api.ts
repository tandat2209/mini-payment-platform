const fallbackApiBaseUrl = 'http://localhost:3001';
const fallbackCustomerExternalRef = 'user_demo_alice';

interface AppRuntimeEnv {
  VITE_API_BASE_URL?: string;
  VITE_CUSTOMER_EXTERNAL_REF?: string;
}

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

type WalletBalancesResponse = {
  balances: WalletBalance[];
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

function getNodeEnv(): AppRuntimeEnv | undefined {
  const runtime = globalThis as typeof globalThis & {
    process?: {
      env?: AppRuntimeEnv;
    };
  };

  return runtime.process?.env;
}

function getImportMetaEnv(): AppRuntimeEnv | undefined {
  const meta = import.meta as ImportMeta & {
    env?: AppRuntimeEnv;
  };

  return meta.env;
}

function getErrorMessage(caughtError: unknown): string {
  return caughtError instanceof Error ? caughtError.message : 'Unknown error';
}

function buildApiUrl(path: string): string {
  const normalizedBaseUrl = getApiBaseUrl().replace(/\/$/, '');

  return `${normalizedBaseUrl}${path}`;
}

function createHeaders(includeCustomerContext: boolean, headers?: HeadersInit): Headers {
  const requestHeaders = new Headers(headers);

  if (includeCustomerContext) {
    requestHeaders.set('x-customer-external-ref', getCustomerExternalRef());
  }

  return requestHeaders;
}

async function fetchJson<T>(
  path: string,
  options?: {
    errorLabel?: string;
    headers?: HeadersInit;
    includeCustomerContext?: boolean;
  },
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    headers: createHeaders(options?.includeCustomerContext ?? true, options?.headers),
  });

  if (!response.ok) {
    throw new Error(`${options?.errorLabel ?? 'Request'} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
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

export function getApiBaseUrl(): string {
  return (
    getImportMetaEnv()?.VITE_API_BASE_URL ?? getNodeEnv()?.VITE_API_BASE_URL ?? fallbackApiBaseUrl
  );
}

export function getCustomerExternalRef(): string {
  return (
    getImportMetaEnv()?.VITE_CUSTOMER_EXTERNAL_REF ??
    getNodeEnv()?.VITE_CUSTOMER_EXTERNAL_REF ??
    fallbackCustomerExternalRef
  );
}

export async function fetchHealth(): Promise<HealthResponse> {
  return await fetchJson<HealthResponse>('/health', {
    errorLabel: 'Health request',
    includeCustomerContext: false,
  });
}

export async function fetchBalances(): Promise<WalletBalancesResponse> {
  return await fetchJson<WalletBalancesResponse>('/customers/me/balances', {
    errorLabel: 'Balance request',
  });
}

export async function fetchTransactions(limit: number): Promise<TransactionListResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  return await fetchJson<TransactionListResponse>(
    `/customers/me/transactions?${params.toString()}`,
    {
      errorLabel: 'Transaction request',
    },
  );
}

export async function fetchRecipients(): Promise<RecipientListResponse> {
  return await fetchJson<RecipientListResponse>('/customers/me/recipients', {
    errorLabel: 'Recipient request',
  });
}

export async function fetchStatementPeriods(): Promise<StatementPeriodListResponse> {
  return await fetchJson<StatementPeriodListResponse>('/customers/me/statements', {
    errorLabel: 'Statement period request',
  });
}

export async function fetchStatementDetail(
  period: StatementPeriod,
): Promise<StatementDetailResponse> {
  return await fetchJson<StatementDetailResponse>(
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
  HealthResponse,
  MoneyDto,
  RecipientListResponse,
  RecipientSummary,
  StatementDetailResponse,
  StatementOverviewData,
  StatementPeriod,
  TransactionItem,
  TransactionListResponse,
  WalletBalance,
  WalletBalancesResponse,
};
