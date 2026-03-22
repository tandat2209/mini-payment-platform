import { type TransactionCursor } from '../../shared/api/cursor';

export type TransactionListFilters = {
  currency: string | null;
  cursor: TransactionCursor | null;
  dateFrom: string | null;
  dateTo: string | null;
  limit: number;
  status: string | null;
  type: string | null;
};

export type TransactionListItemView = {
  currency: string;
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
};

export type TransactionDetailView = TransactionListItemView & {
  payoutContext: {
    payoutId: string;
    payoutReference: string | null;
    recipientId: string | null;
    recipientName: string | null;
  } | null;
};

export type TransactionListView = {
  items: TransactionListItemView[];
  nextCursor: string | null;
};

export interface TransactionQueryRepository {
  getTransactionDetail(
    customerId: string,
    transactionId: string,
  ): Promise<TransactionDetailView | null>;
  listTransactions(
    customerId: string,
    filters: TransactionListFilters,
  ): Promise<TransactionListView>;
}

export const TRANSACTION_QUERY_REPOSITORY = Symbol('TRANSACTION_QUERY_REPOSITORY');
