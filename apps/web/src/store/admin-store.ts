import { create } from 'zustand';

import { type AdminSimulationResponse, triggerAdminFundingSimulation } from '../api';
import type {
  AdminLedgerTransactionRecord,
  AdminSimulationFormState,
  AdminSimulationResult,
  AdminTransactionRecord,
} from '../components/admin/admin-data';
import {
  initialAdminLedgerTransactions,
  initialAdminSimulationFormState,
  initialAdminTransactions,
} from '../components/admin/admin-data';

type AdminStore = {
  formState: AdminSimulationFormState;
  isSubmitting: boolean;
  ledgerTransactions: AdminLedgerTransactionRecord[];
  simulationError: string | null;
  selectedLedgerTransactionId: string | null;
  selectedTransactionId: string | null;
  setFormField: (field: keyof AdminSimulationFormState, value: string) => void;
  setSelectedLedgerTransactionId: (transactionId: string | null) => void;
  setSelectedTransactionId: (transactionId: string | null) => void;
  setTransactionSearchQuery: (query: string) => void;
  setTransactionTypeFilter: (filter: 'all' | 'funding' | 'payout') => void;
  simulateFunding: () => Promise<void>;
  simulationResult: AdminSimulationResult | null;
  transactionSearchQuery: string;
  transactions: AdminTransactionRecord[];
  transactionTypeFilter: 'all' | 'funding' | 'payout';
};

export const useAdminStore = create<AdminStore>((set, get) => ({
  formState: initialAdminSimulationFormState,
  isSubmitting: false,
  ledgerTransactions: initialAdminLedgerTransactions,
  simulationError: null,
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
  simulateFunding: async () => {
    if (get().isSubmitting) {
      return;
    }

    set({ isSubmitting: true, simulationError: null });

    const formState = get().formState;
    const request: Parameters<typeof triggerAdminFundingSimulation>[0] = {
      amountMinor: Number.parseInt(formState.amountMinor, 10),
      currency: formState.currency.trim().toUpperCase(),
      destinationIdentifier: formState.destinationIdentifier.trim(),
      destinationType: formState.destinationType,
    };
    const description = toOptionalTrimmedString(formState.description);
    const externalEventId = toOptionalTrimmedString(formState.externalEventId);
    const providerReference = toOptionalTrimmedString(formState.providerReference);
    const senderName = formState.senderName.trim();

    if (description !== undefined) {
      request.description = description;
    }

    if (externalEventId !== undefined) {
      request.externalEventId = externalEventId;
    }

    if (providerReference !== undefined) {
      request.providerReference = providerReference;
    }

    if (senderName.length > 0) {
      request.sender = {
        name: senderName,
      };

      const senderAccountIdentifier = toOptionalTrimmedString(formState.senderAccountIdentifier);
      const senderBankCode = toOptionalTrimmedString(formState.senderBankCode);
      const senderBankName = toOptionalTrimmedString(formState.senderBankName);

      if (senderAccountIdentifier !== undefined) {
        request.sender.accountIdentifier = senderAccountIdentifier;
      }

      if (senderBankCode !== undefined) {
        request.sender.bankCode = senderBankCode;
      }

      if (senderBankName !== undefined) {
        request.sender.bankName = senderBankName;
      }
    }

    if (!Number.isFinite(request.amountMinor) || request.amountMinor <= 0) {
      set({
        isSubmitting: false,
        simulationError: 'Amount minor must be a positive integer.',
      });
      return;
    }

    try {
      const response: AdminSimulationResponse = await triggerAdminFundingSimulation(request);
      const receiverDuplicate =
        typeof response.receiverResponse.duplicate === 'boolean'
          ? response.receiverResponse.duplicate
          : null;
      const receiverProcessingStatus =
        typeof response.receiverResponse.processingStatus === 'string'
          ? response.receiverResponse.processingStatus
          : null;

      set({
        isSubmitting: false,
        simulationResult: {
          delivered: response.delivered,
          deliveryTarget: response.deliveryTarget,
          externalEventId: response.externalEventId,
          mode: 'sandbox_live',
          postedAt: response.payload.occurredAt,
          provider: response.payload.provider,
          providerReference: response.payload.data.providerReference ?? null,
          receiverDuplicate,
          receiverProcessingStatus,
          status: 'delivered',
        },
      });
    } catch (caughtError) {
      set({
        isSubmitting: false,
        simulationError:
          caughtError instanceof Error ? caughtError.message : 'Admin simulator request failed.',
      });
    }
  },
  simulationResult: null,
  transactionSearchQuery: '',
  transactions: initialAdminTransactions,
  transactionTypeFilter: 'all',
}));

function toOptionalTrimmedString(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}
