import type { RecipientRail } from '../../recipients/domain/recipient-onboarding.types';

export type PreparePayoutIntentInput = {
  amountMinor: number;
  currency: string;
  customerId: string;
  recipientRailId: string;
  reference?: string | null;
  sourceWalletId: string;
};

export type PreparedPayoutSubmissionTarget =
  | {
      mode: 'inline_recipient_details';
      details: Record<string, string>;
    }
  | {
      mode: 'provider_reference';
      providerReference: string;
    };

export type PreparedPayoutIntent = {
  amountMinor: number;
  currency: string;
  customerId: string;
  rail: RecipientRail;
  recipientId: string;
  recipientName: string;
  recipientRailId: string;
  reference: string | null;
  sourceWalletId: string;
  submissionTarget: PreparedPayoutSubmissionTarget;
};

export class PayoutRecipientRailNotFoundError extends Error {
  constructor(recipientRailId: string) {
    super(`Recipient rail not found: ${recipientRailId}`);
    this.name = 'PayoutRecipientRailNotFoundError';
  }
}

export class PayoutRecipientRailNotReadyError extends Error {
  constructor(recipientRailId: string, reason: string) {
    super(`Recipient rail ${recipientRailId} is not payout ready: ${reason}`);
    this.name = 'PayoutRecipientRailNotReadyError';
  }
}

export class PayoutRecipientRailCurrencyMismatchError extends Error {
  constructor(recipientRailId: string, expectedCurrency: string, payoutCurrency: string) {
    super(
      `Recipient rail ${recipientRailId} is configured for ${expectedCurrency}, not ${payoutCurrency}`,
    );
    this.name = 'PayoutRecipientRailCurrencyMismatchError';
  }
}

export class ProviderManagedRecipientRailMissingReferenceError extends Error {
  constructor(recipientRailId: string) {
    super(`Provider-managed recipient rail ${recipientRailId} is missing provider reference`);
    this.name = 'ProviderManagedRecipientRailMissingReferenceError';
  }
}
