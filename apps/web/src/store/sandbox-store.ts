import { create } from 'zustand';

import { type SandboxFundingResponse, triggerSandboxFundingSimulation } from '../api';
import {
  initialSandboxFundingSimulationFormState,
  type SandboxFundingSimulationFormState,
  type SandboxFundingSimulationResult,
} from '../components/sandbox/sandbox-data';
import { queryClient } from '../lib/query-client';

type SandboxStore = {
  formState: SandboxFundingSimulationFormState;
  isSubmitting: boolean;
  setFormField: (field: keyof SandboxFundingSimulationFormState, value: string) => void;
  simulateFunding: () => Promise<void>;
  simulationError: string | null;
  simulationResult: SandboxFundingSimulationResult | null;
};

export const useSandboxStore = create<SandboxStore>((set, get) => ({
  formState: initialSandboxFundingSimulationFormState,
  isSubmitting: false,
  setFormField: (field, value) =>
    set((state) => ({
      formState: {
        ...state.formState,
        [field]: value,
      },
    })),
  simulateFunding: async () => {
    if (get().isSubmitting) {
      return;
    }

    set({ isSubmitting: true, simulationError: null });

    const formState = get().formState;
    const request: Parameters<typeof triggerSandboxFundingSimulation>[0] = {
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
      const response: SandboxFundingResponse = await triggerSandboxFundingSimulation(request);
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-ledgers'] }),
      ]);
    } catch (caughtError) {
      set({
        isSubmitting: false,
        simulationError:
          caughtError instanceof Error ? caughtError.message : 'PSP sandbox request failed.',
      });
    }
  },
  simulationError: null,
  simulationResult: null,
}));

function toOptionalTrimmedString(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}
