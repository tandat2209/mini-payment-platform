import { create } from 'zustand';

type TransactionFilter = 'all' | 'credit' | 'debit';
type CurrencyFilter = 'all' | string;

type DashboardStore = {
  currencyFilter: CurrencyFilter;
  setCurrencyFilter: (currencyFilter: CurrencyFilter) => void;
  setTransactionSearchQuery: (transactionSearchQuery: string) => void;
  setTransactionFilter: (transactionFilter: TransactionFilter) => void;
  transactionFilter: TransactionFilter;
  transactionSearchQuery: string;
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  currencyFilter: 'all',
  setCurrencyFilter: (currencyFilter) => set({ currencyFilter }),
  setTransactionSearchQuery: (transactionSearchQuery) => set({ transactionSearchQuery }),
  setTransactionFilter: (transactionFilter) => set({ transactionFilter }),
  transactionFilter: 'all',
  transactionSearchQuery: '',
}));

export type { CurrencyFilter, TransactionFilter };
