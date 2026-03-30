import { type TransactionContext } from '../../shared/application/transaction-manager';

export type OwnedWalletBalance = {
  availableAmountMinor: number;
  walletId: string;
};

export type PayoutExecutionRecord = {
  attemptId: string;
  attemptStatus: 'accepted' | 'failed' | 'processing' | 'submitted' | 'succeeded' | 'unknown';
  currency: string;
  feeAmountMinor: number;
  grossAmountMinor: number;
  netAmountMinor: number;
  payoutId: string;
  payoutReference: string | null;
  payoutStatus: 'failed' | 'paid' | 'processing' | 'returned' | 'submitted';
  provider: string;
  recipientId: string;
  userId: string;
  userTransactionId: string;
  walletId: string;
};

export interface PayoutWalletRepository {
  creditAvailableBalance(
    context: TransactionContext,
    input: {
      amountMinor: number;
      currency: string;
      updatedAt: string;
      walletId: string;
    },
  ): Promise<void>;
  debitAvailableBalance(
    context: TransactionContext,
    input: {
      amountMinor: number;
      currency: string;
      updatedAt: string;
      walletId: string;
    },
  ): Promise<boolean>;
  findOwnedActiveWalletBalance(
    context: TransactionContext,
    input: {
      currency: string;
      customerId: string;
      walletId: string;
    },
  ): Promise<OwnedWalletBalance | null>;
}

export interface PayoutWriteRepository {
  createPayoutBooking(
    context: TransactionContext,
    input: {
      createdAt: string;
      currency: string;
      description: string;
      feeAmountMinor: number;
      grossAmountMinor: number;
      netAmountMinor: number;
      occurredAt: string;
      payoutId: string;
      rail: string;
      recipientId: string;
      recipientRailId: string;
      reference: string;
      idempotencyKeyId?: string | null;
      userId: string;
      userTransactionId: string;
      walletId: string;
    },
  ): Promise<void>;
  findExecutionByProviderPayoutId(
    context: TransactionContext,
    input: {
      externalPayoutId: string;
      provider: string;
    },
  ): Promise<PayoutExecutionRecord | null>;
  markPayoutAsFailed(
    context: TransactionContext,
    input: {
      failedAt: string;
      payoutId: string;
      updatedAt: string;
      userTransactionId: string;
      webhookEventId: string;
    },
  ): Promise<void>;
  markPayoutAsPaid(
    context: TransactionContext,
    input: {
      completedAt: string;
      payoutId: string;
      updatedAt: string;
      userTransactionId: string;
      webhookEventId: string;
    },
  ): Promise<void>;
  markPayoutAsProcessing(
    context: TransactionContext,
    input: {
      payoutId: string;
      updatedAt: string;
    },
  ): Promise<void>;
  markPayoutAsReturned(
    context: TransactionContext,
    input: {
      payoutId: string;
      userTransactionId: string;
      webhookEventId: string;
      returnedAmountMinor: number;
      returnedAt: string;
      updatedAt: string;
    },
  ): Promise<void>;
  createReturnedPayoutCreditTransaction(
    context: TransactionContext,
    input: {
      amountMinor: number;
      createdAt: string;
      currency: string;
      description: string;
      occurredAt: string;
      payoutId: string;
      reference: string | null;
      userId: string;
      userTransactionId: string;
      walletId: string;
      webhookEventId: string;
    },
  ): Promise<void>;
  recordSubmissionAttempt(
    context: TransactionContext,
    input: {
      attemptId: string;
      externalPayoutId: string;
      externalRequestId: string;
      idempotencyKeyId?: string | null;
      payoutId: string;
      provider: string;
      requestPayload: Record<string, unknown>;
      responsePayload: Record<string, unknown>;
      status: 'accepted';
      submittedAt: string;
    },
  ): Promise<void>;
  updateAttemptOutcome(
    context: TransactionContext,
    input: {
      attemptId: string;
      responsePayload: Record<string, unknown>;
      resolvedAt?: string;
      status: 'failed' | 'processing' | 'succeeded';
    },
  ): Promise<void>;
  updatePayoutAfterSubmission(
    context: TransactionContext,
    input: {
      payoutId: string;
      status: 'submitted';
      submittedAt: string;
      updatedAt: string;
    },
  ): Promise<void>;
}

export const PAYOUT_WALLET_REPOSITORY = Symbol('PAYOUT_WALLET_REPOSITORY');
export const PAYOUT_WRITE_REPOSITORY = Symbol('PAYOUT_WRITE_REPOSITORY');
