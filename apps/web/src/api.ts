import { getJson, postJson, postJsonToBase } from './lib/api-client';
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
    completedAt: string | null;
    failedAt: string | null;
    payoutId: string;
    payoutReference: string | null;
    recipientId: string | null;
    recipientName: string | null;
    status: 'failed' | 'paid' | 'pending_submission' | 'processing' | 'submitted';
    submittedAt: string | null;
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
    countryCode: string;
    currency: string | null;
    id: string;
    isDefault: boolean;
    payoutReady: boolean;
    providerRegistrationError: string | null;
    providerRegistrationStrategy: string;
    rail: string;
    readinessStatus: string;
  }>;
  status: string;
};

type RecipientListResponse = {
  items: RecipientSummary[];
};

type RecipientRequirementField = {
  helpText?: string;
  key: string;
  kind: string;
  label: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  placeholder?: string;
  required: boolean;
};

type RecipientRequirementsResponse = {
  countryCode: string;
  currency: string;
  fields: RecipientRequirementField[];
  initialReadinessStatus: string;
  providerRegistrationStrategy: string;
  rail: string;
};

type RecipientCapabilitiesResponse = {
  items: Array<{
    countryCode: string;
    countryName: string;
    rails: Array<{
      currencies: Array<{
        currency: string;
      }>;
      description: string;
      providerRegistrationStrategy: string;
      rail: 'ach' | 'sepa' | 'swift';
    }>;
  }>;
};

type RecipientRailCreateRequest = {
  countryCode: string;
  currency: string;
  details: Record<string, string>;
  isDefault?: boolean;
  rail: 'ach' | 'sepa' | 'swift';
};

type CreateRecipientRequest = {
  name: string;
  rail: RecipientRailCreateRequest;
};

type AddRecipientRailRequest = RecipientRailCreateRequest;

type RecipientCreateResponse = {
  createdAt: string | null;
  id: string;
  name: string;
  rails: RecipientSummary['rails'];
  status: string;
};

type CreatePayoutRequest = {
  amountMinor: number;
  idempotencyKey?: string;
  recipientRailId: string;
  reference?: string;
  sourceCurrency: string;
  sourceWalletId: string;
};

type CreatePayoutResponse = {
  amounts: {
    fee: MoneyDto;
    gross: MoneyDto;
    net: MoneyDto;
  };
  createdAt: string;
  payout: {
    id: string;
    reference: string;
    status: string;
  };
  recipient: {
    id: string;
    name: string;
    rail: string;
    railId: string;
  };
  transaction: {
    id: string;
  };
  wallet: {
    id: string;
  };
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

type SandboxPayoutUpdateRequest = {
  externalEventId?: string;
  externalPayoutId: string;
  failureReason?: string;
  status: 'failed' | 'paid' | 'processing';
};

type SandboxPayoutUpdateResponse = {
  deliveryTarget: string;
  delivered: true;
  externalEventId: string;
  payload: {
    data: {
      externalPayoutId: string;
      externalRequestId: string;
      failureReason?: string;
      payoutReference: string;
      status: 'failed' | 'paid' | 'processing';
    };
    eventType: 'payout.updated';
    externalEventId: string;
    occurredAt: string;
    provider: 'psp_sandbox';
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

type AdminWalletItem = {
  balances: Array<{
    available: MoneyDto;
    currency: string;
    pending: MoneyDto;
    updatedAt: string | null;
  }>;
  closedAt: string | null;
  customer: {
    externalRef: string;
    id: string;
  };
  lastMovementAt: string | null;
  openedAt: string | null;
  status: string;
  wallet: {
    id: string;
    label: string | null;
  };
};

type AdminWalletListResponse = {
  items: AdminWalletItem[];
};

type AdminBalanceSummaryItem = {
  activeWalletCount: number;
  accountingIntegrity: {
    isBalanced: boolean;
    trialBalanceDelta: MoneyDto;
    unbalancedJournalCount: number;
  };
  available: MoneyDto;
  businessIntegrity: {
    cashCoverageGap: MoneyDto;
    inFlightGross: MoneyDto;
    inFlightNet: MoneyDto;
    inFlightPayoutCount: number;
    isHealthy: boolean;
    issues: Array<{
      code: string;
      count: number | null;
      severity: 'high' | 'medium';
      summary: string;
      value: MoneyDto | null;
    }>;
    walletExposure: MoneyDto;
    walletExposureMismatch: MoneyDto;
  };
  currency: string;
  pending: MoneyDto;
  positions: {
    platformCash: MoneyDto;
    platformRevenue: MoneyDto;
    recipientPayables: MoneyDto;
    walletLiabilities: MoneyDto;
  };
  postedToday: number;
};

type AdminBalanceSummaryResponse = {
  items: AdminBalanceSummaryItem[];
};

type AdminPayoutItem = {
  amounts: {
    fee: MoneyDto;
    gross: MoneyDto;
  };
  attemptStatus: string | null;
  completedAt: string | null;
  createdAt: string | null;
  currency: string;
  customer: {
    externalRef: string;
    id: string;
  };
  externalPayoutId: string | null;
  externalRequestId: string | null;
  failedAt: string | null;
  id: string;
  latestWebhookEventId: string | null;
  provider: string | null;
  recipient: {
    id: string;
    name: string;
  };
  reference: string | null;
  status: string;
  submittedAt: string | null;
  userTransactionId: string;
  walletId: string;
};

type AdminPayoutListResponse = {
  items: AdminPayoutItem[];
};

type AdminRecipientItem = {
  createdAt: string | null;
  customer: {
    externalRef: string;
    id: string;
  };
  id: string;
  name: string;
  rails: Array<{
    countryCode: string;
    currency: string | null;
    id: string;
    payoutReady: boolean;
    providerRegistrationError: string | null;
    rail: string;
    readinessStatus: string;
  }>;
  status: string;
};

type AdminRecipientListResponse = {
  items: AdminRecipientItem[];
};

type AdminWebhookEventItem = {
  eventType: string;
  externalEventId: string;
  id: string;
  linkedPayoutId: string | null;
  linkedTransactionId: string | null;
  payload: Record<string, unknown>;
  processingStatus: string;
  processedAt: string | null;
  provider: string;
  receivedAt: string | null;
};

type AdminWebhookEventListResponse = {
  items: AdminWebhookEventItem[];
};

type AdminReconciliationExceptionItem = {
  kind: string;
  linkedLedgerTransactionId: string | null;
  linkedPayoutId: string | null;
  linkedTransactionId: string | null;
  linkedWebhookEventId: string | null;
  occurredAt: string | null;
  reference: string | null;
  severity: string;
  sourceId: string;
  summary: string;
};

type AdminReconciliationExceptionListResponse = {
  items: AdminReconciliationExceptionItem[];
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

export async function fetchRecipientRequirements(input: {
  countryCode: string;
  currency: string;
  rail: 'ach' | 'sepa' | 'swift';
}): Promise<RecipientRequirementsResponse> {
  const params = new URLSearchParams({
    countryCode: input.countryCode,
    currency: input.currency,
    rail: input.rail,
  });

  return await getJson<RecipientRequirementsResponse>(
    `/customers/me/recipients/requirements?${params.toString()}`,
    {
      errorLabel: 'Recipient requirements request',
    },
  );
}

export async function fetchRecipientCapabilities(input?: {
  countryCode?: string;
  rail?: 'ach' | 'sepa' | 'swift';
}): Promise<RecipientCapabilitiesResponse> {
  const params = new URLSearchParams();

  if (input?.countryCode) {
    params.set('countryCode', input.countryCode);
  }

  if (input?.rail) {
    params.set('rail', input.rail);
  }

  const query = params.toString();

  return await getJson<RecipientCapabilitiesResponse>(
    `/customers/me/recipients/capabilities${query ? `?${query}` : ''}`,
    {
      errorLabel: 'Recipient capabilities request',
    },
  );
}

export async function createRecipient(
  request: CreateRecipientRequest,
): Promise<RecipientCreateResponse> {
  return await postJson<RecipientCreateResponse, CreateRecipientRequest>(
    '/customers/me/recipients',
    request,
    {
      errorLabel: 'Create recipient request',
    },
  );
}

export async function addRecipientRail(
  recipientId: string,
  request: AddRecipientRailRequest,
): Promise<{ rail: RecipientSummary['rails'][number] }> {
  return await postJson<{ rail: RecipientSummary['rails'][number] }, AddRecipientRailRequest>(
    `/customers/me/recipients/${recipientId}/rails`,
    request,
    {
      errorLabel: 'Add recipient rail request',
    },
  );
}

export async function createPayout(request: CreatePayoutRequest): Promise<CreatePayoutResponse> {
  const { idempotencyKey, ...body } = request;

  return await postJson<CreatePayoutResponse, Omit<CreatePayoutRequest, 'idempotencyKey'>>(
    '/customers/me/payouts',
    body,
    {
      errorLabel: 'Create payout request',
      ...(idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {}),
    },
  );
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

export async function triggerSandboxPayoutUpdateSimulation(
  request: SandboxPayoutUpdateRequest,
): Promise<SandboxPayoutUpdateResponse> {
  return await postJsonToBase<SandboxPayoutUpdateResponse, SandboxPayoutUpdateRequest>(
    getPspSandboxBaseUrl(),
    '/simulate/payout-updates',
    request,
    {
      errorLabel: 'PSP sandbox payout update request',
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

export async function fetchAdminWallets(): Promise<AdminWalletListResponse> {
  return await getJson<AdminWalletListResponse>('/admin/wallets', {
    errorLabel: 'Admin wallets request',
    includeCustomerContext: false,
  });
}

export async function fetchAdminBalanceSummaries(): Promise<AdminBalanceSummaryResponse> {
  return await getJson<AdminBalanceSummaryResponse>('/admin/balances', {
    errorLabel: 'Admin balances request',
    includeCustomerContext: false,
  });
}

export async function fetchAdminPayouts(): Promise<AdminPayoutListResponse> {
  return await getJson<AdminPayoutListResponse>('/admin/payouts', {
    errorLabel: 'Admin payouts request',
    includeCustomerContext: false,
  });
}

export async function fetchAdminRecipients(): Promise<AdminRecipientListResponse> {
  return await getJson<AdminRecipientListResponse>('/admin/recipients', {
    errorLabel: 'Admin recipients request',
    includeCustomerContext: false,
  });
}

export async function fetchAdminWebhooks(): Promise<AdminWebhookEventListResponse> {
  return await getJson<AdminWebhookEventListResponse>('/admin/webhooks', {
    errorLabel: 'Admin webhooks request',
    includeCustomerContext: false,
  });
}

export async function fetchAdminReconciliationExceptions(): Promise<AdminReconciliationExceptionListResponse> {
  return await getJson<AdminReconciliationExceptionListResponse>(
    '/admin/reconciliation/exceptions',
    {
      errorLabel: 'Admin reconciliation request',
      includeCustomerContext: false,
    },
  );
}

export type {
  AdminBalanceSummaryItem,
  AdminBalanceSummaryResponse,
  AdminLedgerDetailItem,
  AdminLedgerItem,
  AdminLedgerListResponse,
  AdminPayoutItem,
  AdminPayoutListResponse,
  AdminRecipientItem,
  AdminRecipientListResponse,
  AdminReconciliationExceptionItem,
  AdminReconciliationExceptionListResponse,
  AdminTransactionDetailItem,
  AdminTransactionItem,
  AdminTransactionListResponse,
  AdminWalletItem,
  AdminWalletListResponse,
  AdminWebhookEventItem,
  AdminWebhookEventListResponse,
  CreatePayoutRequest,
  CreatePayoutResponse,
  FundingDetailValue,
  HealthResponse,
  MoneyDto,
  RecipientCapabilitiesResponse,
  RecipientCreateResponse,
  RecipientListResponse,
  RecipientRequirementField,
  RecipientRequirementsResponse,
  RecipientSummary,
  SandboxFundingRequest,
  SandboxFundingResponse,
  SandboxPayoutUpdateRequest,
  SandboxPayoutUpdateResponse,
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
