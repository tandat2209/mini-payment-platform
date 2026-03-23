export type AdminLedgerCursor = {
  id: string;
  postedAt: string;
};

export type AdminLedgerListFilters = {
  currency: string | null;
  cursor: AdminLedgerCursor | null;
  limit: number;
  query: string | null;
  status: string | null;
  transactionType: string | null;
};

export type AdminLedgerListItemView = {
  creditAmountMinor: string;
  currency: string;
  debitAmountMinor: string;
  description: string | null;
  entryCount: number;
  id: string;
  postedAt: Date | string | null;
  reference: string | null;
  status: string;
  transactionType: string;
  userTransactionId: string | null;
  webhookEventId: string | null;
};

export type AdminLedgerEntryView = {
  accountCode: string;
  accountId: string;
  accountName: string;
  accountType: string;
  amountMinor: string;
  currency: string;
  description: string | null;
  direction: string;
  id: string;
  ownerId: string | null;
  ownerType: string | null;
};

export type AdminLedgerDetailView = AdminLedgerListItemView & {
  entries: AdminLedgerEntryView[];
};

export type AdminLedgerSummaryView = {
  accountGroupSummaries: Array<{
    accountCount: number;
    accountGroup: string;
    creditAmountMinor: string;
    currency: string;
    debitAmountMinor: string;
    description: string;
    netAmountMinor: string;
  }>;
  currencySummaries: Array<{
    creditAmountMinor: string;
    currency: string;
    debitAmountMinor: string;
    deltaAmountMinor: string;
  }>;
  trialBalanceRows: Array<{
    accountCode: string;
    accountGroup: string;
    accountName: string;
    accountType: string;
    creditAmountMinor: string;
    currency: string;
    debitAmountMinor: string;
    netAmountMinor: string;
  }>;
  unbalancedTransactions: number;
};

export type AdminLedgerListView = {
  items: AdminLedgerListItemView[];
  nextCursor: string | null;
  summary: AdminLedgerSummaryView;
};

export interface AdminLedgerQueryRepository {
  getLedgerTransactionDetail(ledgerTransactionId: string): Promise<AdminLedgerDetailView | null>;
  listLedgerTransactions(filters: AdminLedgerListFilters): Promise<AdminLedgerListView>;
}

export const ADMIN_LEDGER_QUERY_REPOSITORY = Symbol('ADMIN_LEDGER_QUERY_REPOSITORY');
