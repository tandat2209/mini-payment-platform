export type CreatePayoutInput = {
  amountMinor: number;
  customerId: string;
  idempotencyKey: string;
  recipientRailId: string;
  reference?: string | null;
  sourceCurrency: string;
  sourceWalletId: string;
};

export type CreatedPayout = {
  amounts: {
    feeAmountMinor: string;
    grossAmountMinor: string;
    netAmountMinor: string;
  };
  createdAt: string;
  currency: string;
  payoutId: string;
  recipient: {
    id: string;
    name: string;
    rail: string;
    railId: string;
  };
  reference: string;
  status: 'pending_submission' | 'processing' | 'submitted';
  transactionId: string;
  walletId: string;
};

export class PayoutSourceWalletNotFoundError extends Error {
  constructor(walletId: string, currency: string) {
    super(`Source wallet ${walletId} with currency ${currency} was not found`);
    this.name = 'PayoutSourceWalletNotFoundError';
  }
}

export class InsufficientWalletBalanceError extends Error {
  constructor(walletId: string, currency: string, requiredAmountMinor: number) {
    super(
      `Wallet ${walletId} does not have enough available ${currency} for payout amount ${requiredAmountMinor}`,
    );
    this.name = 'InsufficientWalletBalanceError';
  }
}

export class PayoutIdempotencyConflictError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'PayoutIdempotencyConflictError';
  }
}
