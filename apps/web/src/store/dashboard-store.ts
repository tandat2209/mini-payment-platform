import { create } from 'zustand';

type ActiveSection =
  | 'Overview'
  | 'Balances'
  | 'Transactions'
  | 'Recipients'
  | 'Statements'
  | 'Settings';

type TransactionFilter = 'all' | 'credit' | 'debit';
type CurrencyFilter = 'all' | string;

type DashboardStore = {
  activeSection: ActiveSection;
  currencyFilter: CurrencyFilter;
  transactionSearchQuery: string;
  transactionFilter: TransactionFilter;
  setCurrencyFilter: (currencyFilter: CurrencyFilter) => void;
  setActiveSection: (activeSection: ActiveSection) => void;
  setTransactionSearchQuery: (transactionSearchQuery: string) => void;
  setTransactionFilter: (transactionFilter: TransactionFilter) => void;
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeSection: 'Overview',
  currencyFilter: 'all',
  transactionSearchQuery: '',
  setCurrencyFilter: (currencyFilter) => set({ currencyFilter }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setTransactionSearchQuery: (transactionSearchQuery) => set({ transactionSearchQuery }),
  setTransactionFilter: (transactionFilter) => set({ transactionFilter }),
  transactionFilter: 'all',
}));

export type { ActiveSection, CurrencyFilter, TransactionFilter };
