import { type TransactionContext } from '../../shared/application/transaction-manager';
import { type FundingWebhook, type RecordedWebhookEvent } from './funding.types';

export type FundingTarget = {
  userId: string;
  walletId: string;
};

export interface FundingWebhookStore {
  findByProviderEvent(
    context: TransactionContext,
    provider: string,
    externalEventId: string,
  ): Promise<RecordedWebhookEvent | null>;
  markProcessingStatus(
    context: TransactionContext,
    webhookId: string,
    processingStatus: 'failed' | 'processed',
    processedAt: string,
  ): Promise<RecordedWebhookEvent>;
  recordReceived(
    context: TransactionContext,
    payload: FundingWebhook,
    webhookId: string,
    receivedAt: string,
  ): Promise<RecordedWebhookEvent | null>;
}

export interface FundingTargetRepository {
  findActiveFundingTarget(
    context: TransactionContext,
    payload: FundingWebhook,
  ): Promise<FundingTarget | null>;
}

export interface WalletBalanceWriter {
  creditAvailableBalance(
    context: TransactionContext,
    input: {
      amountMinor: number;
      currency: string;
      updatedAt: string;
      walletId: string;
    },
  ): Promise<void>;
}

export interface FundingTransactionWriter {
  createFundingTransaction(
    context: TransactionContext,
    input: {
      amountMinor: number;
      currency: string;
      description: string;
      occurredAt: string;
      postedAt: string;
      reference: string;
      userId: string;
      walletId: string;
      webhookEventId: string;
    },
  ): Promise<string>;
}

export const FUNDING_WEBHOOK_STORE = Symbol('FUNDING_WEBHOOK_STORE');
export const FUNDING_TARGET_REPOSITORY = Symbol('FUNDING_TARGET_REPOSITORY');
export const WALLET_BALANCE_WRITER = Symbol('WALLET_BALANCE_WRITER');
export const FUNDING_TRANSACTION_WRITER = Symbol('FUNDING_TRANSACTION_WRITER');
