import { create } from 'zustand';

import type {
  AdminLedgerTransactionRecord,
  AdminSimulationFormState,
  AdminSimulationResult,
  AdminTransactionRecord,
} from '../components/admin/admin-data';
import {
  buildPreviewFundingActivity,
  initialAdminLedgerTransactions,
  initialAdminSimulationFormState,
  initialAdminTransactions,
} from '../components/admin/admin-data';

type AdminStore = {
  formState: AdminSimulationFormState;
  isSubmitting: boolean;
  ledgerTransactions: AdminLedgerTransactionRecord[];
  selectedLedgerTransactionId: string | null;
  selectedTransactionId: string | null;
  setFormField: (field: keyof AdminSimulationFormState, value: string) => void;
  setSelectedLedgerTransactionId: (transactionId: string | null) => void;
  setSelectedTransactionId: (transactionId: string | null) => void;
  setTransactionSearchQuery: (query: string) => void;
  setTransactionTypeFilter: (filter: 'all' | 'funding' | 'payout') => void;
  simulateFunding: () => void;
  simulationResult: AdminSimulationResult | null;
  transactionSearchQuery: string;
  transactions: AdminTransactionRecord[];
  transactionTypeFilter: 'all' | 'funding' | 'payout';
};

export const useAdminStore = create<AdminStore>((set, get) => ({
  formState: initialAdminSimulationFormState,
  isSubmitting: false,
  ledgerTransactions: initialAdminLedgerTransactions,
  selectedLedgerTransactionId: initialAdminLedgerTransactions[0]?.id ?? null,
  selectedTransactionId: initialAdminTransactions[0]?.id ?? null,
  setFormField: (field, value) =>
    set((state) => ({
      formState: {
        ...state.formState,
        [field]: value,
      },
    })),
  setSelectedLedgerTransactionId: (selectedLedgerTransactionId) =>
    set({ selectedLedgerTransactionId }),
  setSelectedTransactionId: (selectedTransactionId) => set({ selectedTransactionId }),
  setTransactionSearchQuery: (transactionSearchQuery) => set({ transactionSearchQuery }),
  setTransactionTypeFilter: (transactionTypeFilter) => set({ transactionTypeFilter }),
  simulateFunding: () => {
    if (get().isSubmitting) {
      return;
    }

    set({ isSubmitting: true });

    const formState = get().formState;

    globalThis.setTimeout(() => {
      const activity = buildPreviewFundingActivity({
        ...formState,
        currency: formState.currency.trim().toUpperCase(),
      });

      set((state) => ({
        isSubmitting: false,
        ledgerTransactions: [activity.ledgerTransaction, ...state.ledgerTransactions],
        selectedLedgerTransactionId: activity.ledgerTransaction.id,
        selectedTransactionId: activity.transaction.id,
        simulationResult: activity.result,
        transactions: [activity.transaction, ...state.transactions],
      }));
    }, 450);
  },
  simulationResult: null,
  transactionSearchQuery: '',
  transactions: initialAdminTransactions,
  transactionTypeFilter: 'all',
}));
