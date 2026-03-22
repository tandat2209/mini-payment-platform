export type StatementPeriodView = {
  currency: string;
  month: number;
  walletId: string;
  year: number;
};

export type StatementLineItemView = {
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

export type StatementDetailView = {
  closingBalanceMinor: string;
  currency: string;
  lineItems: StatementLineItemView[];
  month: number;
  openingBalanceMinor: string;
  totalCreditsMinor: string;
  totalDebitsMinor: string;
  walletId: string;
  year: number;
};

export interface StatementQueryRepository {
  getStatementDetail(
    customerId: string,
    walletId: string,
    currency: string,
    year: number,
    month: number,
  ): Promise<StatementDetailView | null>;
  listAvailableStatementPeriods(customerId: string): Promise<StatementPeriodView[] | null>;
}

export const STATEMENT_QUERY_REPOSITORY = Symbol('STATEMENT_QUERY_REPOSITORY');
