import { create } from 'zustand';

import {
  type SandboxFundingResponse,
  type SandboxPayoutReturnResponse,
  type SandboxPayoutUpdateResponse,
  triggerSandboxFundingSimulation,
  triggerSandboxPayoutReturnSimulation,
  triggerSandboxPayoutUpdateSimulation,
} from '@/features/sandbox/api';
import {
  initialSandboxFundingSimulationFormState,
  initialSandboxPayoutUpdateFormState,
  type SandboxFundingSimulationFormState,
  type SandboxFundingSimulationResult,
  type SandboxPayoutUpdateFormState,
  type SandboxPayoutUpdateResult,
} from '@/features/sandbox/data/sandbox-data';
import { queryClient } from '@/lib/query-client';

type SandboxStore = {
  fundingFormState: SandboxFundingSimulationFormState;
  fundingSimulationError: string | null;
  fundingSimulationResult: SandboxFundingSimulationResult | null;
  isFundingSubmitting: boolean;
  isPayoutUpdateSubmitting: boolean;
  payoutUpdateFormState: SandboxPayoutUpdateFormState;
  payoutUpdateSimulationError: string | null;
  payoutUpdateSimulationResult: SandboxPayoutUpdateResult | null;
  setFundingFormField: (field: keyof SandboxFundingSimulationFormState, value: string) => void;
  setPayoutUpdateFormField: (field: keyof SandboxPayoutUpdateFormState, value: string) => void;
  simulateFunding: () => Promise<void>;
  simulatePayoutUpdate: () => Promise<void>;
};

export const useSandboxStore = create<SandboxStore>((set, get) => ({
  fundingFormState: initialSandboxFundingSimulationFormState,
  fundingSimulationError: null,
  fundingSimulationResult: null,
  isFundingSubmitting: false,
  isPayoutUpdateSubmitting: false,
  payoutUpdateFormState: initialSandboxPayoutUpdateFormState,
  payoutUpdateSimulationError: null,
  payoutUpdateSimulationResult: null,
  setFundingFormField: (field, value) =>
    set((state) => ({
      fundingFormState: {
        ...state.fundingFormState,
        [field]: value,
      },
    })),
  setPayoutUpdateFormField: (field, value) =>
    set((state) => ({
      payoutUpdateFormState: {
        ...state.payoutUpdateFormState,
        [field]: value,
      },
    })),
  simulateFunding: async () => {
    if (get().isFundingSubmitting) {
      return;
    }

    set({ fundingSimulationError: null, isFundingSubmitting: true });

    const formState = get().fundingFormState;
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
        fundingSimulationError: 'Amount minor must be a positive integer.',
        isFundingSubmitting: false,
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
        fundingSimulationResult: {
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
        isFundingSubmitting: false,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-ledgers'] }),
      ]);
    } catch (caughtError) {
      set({
        fundingSimulationError:
          caughtError instanceof Error ? caughtError.message : 'PSP sandbox request failed.',
        isFundingSubmitting: false,
      });
    }
  },
  simulatePayoutUpdate: async () => {
    if (get().isPayoutUpdateSubmitting) {
      return;
    }

    set({ isPayoutUpdateSubmitting: true, payoutUpdateSimulationError: null });

    const formState = get().payoutUpdateFormState;
    const externalPayoutId = formState.externalPayoutId.trim();
    const externalEventId = toOptionalTrimmedString(formState.externalEventId);
    const failureReason = toOptionalTrimmedString(formState.failureReason);

    if (!externalPayoutId) {
      set({
        isPayoutUpdateSubmitting: false,
        payoutUpdateSimulationError: 'External payout id is required.',
      });
      return;
    }

    try {
      if (formState.status === 'returned') {
        const returnedAmountMinor = Number.parseInt(formState.returnedAmountMinor, 10);

        if (!Number.isFinite(returnedAmountMinor) || returnedAmountMinor <= 0) {
          set({
            isPayoutUpdateSubmitting: false,
            payoutUpdateSimulationError: 'Returned amount minor must be a positive integer.',
          });
          return;
        }

        const request: Parameters<typeof triggerSandboxPayoutReturnSimulation>[0] = {
          externalPayoutId,
          returnedAmountMinor,
        };

        if (externalEventId !== undefined) {
          request.externalEventId = externalEventId;
        }

        if (failureReason !== undefined) {
          request.returnReason = failureReason;
        }

        const response: SandboxPayoutReturnResponse =
          await triggerSandboxPayoutReturnSimulation(request);
        const receiverDuplicate =
          typeof response.receiverResponse.duplicate === 'boolean'
            ? response.receiverResponse.duplicate
            : null;
        const receiverProcessingStatus =
          typeof response.receiverResponse === 'object' &&
          response.receiverResponse !== null &&
          'event' in response.receiverResponse &&
          typeof response.receiverResponse.event === 'object' &&
          response.receiverResponse.event !== null &&
          'processingStatus' in response.receiverResponse.event &&
          typeof response.receiverResponse.event.processingStatus === 'string'
            ? response.receiverResponse.event.processingStatus
            : null;

        set({
          isPayoutUpdateSubmitting: false,
          payoutUpdateSimulationResult: {
            delivered: response.delivered,
            deliveryTarget: response.deliveryTarget,
            externalEventId: response.externalEventId,
            payoutReference: response.payload.data.payoutReference,
            postedAt: response.payload.occurredAt,
            provider: response.payload.provider,
            receiverDuplicate,
            receiverProcessingStatus,
            returnedAmountMinor: String(response.payload.data.returnedAmountMinor),
            status: 'returned',
          },
        });
      } else {
        const request: Parameters<typeof triggerSandboxPayoutUpdateSimulation>[0] = {
          externalPayoutId,
          status: formState.status,
        };

        if (externalEventId !== undefined) {
          request.externalEventId = externalEventId;
        }

        if (request.status === 'failed' && failureReason !== undefined) {
          request.failureReason = failureReason;
        }

        const response: SandboxPayoutUpdateResponse =
          await triggerSandboxPayoutUpdateSimulation(request);
        const receiverDuplicate =
          typeof response.receiverResponse.duplicate === 'boolean'
            ? response.receiverResponse.duplicate
            : null;
        const receiverProcessingStatus =
          typeof response.receiverResponse === 'object' &&
          response.receiverResponse !== null &&
          'event' in response.receiverResponse &&
          typeof response.receiverResponse.event === 'object' &&
          response.receiverResponse.event !== null &&
          'processingStatus' in response.receiverResponse.event &&
          typeof response.receiverResponse.event.processingStatus === 'string'
            ? response.receiverResponse.event.processingStatus
            : null;

        set({
          isPayoutUpdateSubmitting: false,
          payoutUpdateSimulationResult: {
            delivered: response.delivered,
            deliveryTarget: response.deliveryTarget,
            externalEventId: response.externalEventId,
            payoutReference: response.payload.data.payoutReference,
            postedAt: response.payload.occurredAt,
            provider: response.payload.provider,
            receiverDuplicate,
            receiverProcessingStatus,
            returnedAmountMinor: null,
            status: response.payload.data.status,
          },
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['balances'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['transaction-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-ledgers'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-payouts'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-reconciliation'] }),
      ]);
    } catch (caughtError) {
      set({
        isPayoutUpdateSubmitting: false,
        payoutUpdateSimulationError:
          caughtError instanceof Error ? caughtError.message : 'PSP sandbox payout update failed.',
      });
    }
  },
}));

function toOptionalTrimmedString(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}
