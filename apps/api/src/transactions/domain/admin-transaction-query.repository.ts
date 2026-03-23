import { type TransactionCursor } from '../../shared/api/cursor';

export type AdminTransactionListFilters = {
  currency: string | null;
  cursor: TransactionCursor | null;
  dateFrom: string | null;
  dateTo: string | null;
  limit: number;
  query: string | null;
  status: string | null;
  type: string | null;
};

export type AdminTransactionListItemView = {
  currency: string;
  customerExternalRef: string;
  customerId: string;
  description: string;
  direction: string;
  feeAmountMinor: string;
  grossAmountMinor: string;
  id: string;
  netAmountMinor: string;
  occurredAt: Date | string;
  postedAt: Date | string | null;
  reference: string | null;
  status: string;
  type: string;
  walletId: string;
  webhookEventId: string | null;
};

export type AdminTransactionDetailView = AdminTransactionListItemView & {
  linkedLedgerTransactions: Array<{
    description: string | null;
    id: string;
    postedAt: Date | string | null;
    reference: string | null;
    status: string;
    transactionType: string;
  }>;
  payoutContext: {
    payoutId: string;
    payoutReference: string | null;
    recipientId: string | null;
    recipientName: string | null;
  } | null;
};

export type AdminTransactionListView = {
  items: AdminTransactionListItemView[];
  nextCursor: string | null;
};

export interface AdminTransactionQueryRepository {
  getTransactionDetail(transactionId: string): Promise<AdminTransactionDetailView | null>;
  listTransactions(filters: AdminTransactionListFilters): Promise<AdminTransactionListView>;
}

export const ADMIN_TRANSACTION_QUERY_REPOSITORY = Symbol('ADMIN_TRANSACTION_QUERY_REPOSITORY');
