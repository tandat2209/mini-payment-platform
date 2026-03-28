import { type TransactionContext } from '../../shared/application/transaction-manager';
import { type PayoutWebhook, type RecordedPayoutWebhookEvent } from './payout-webhook.types';

export interface PayoutWebhookStore {
  findByProviderEvent(
    context: TransactionContext,
    provider: string,
    externalEventId: string,
  ): Promise<RecordedPayoutWebhookEvent | null>;
  markProcessingStatus(
    context: TransactionContext,
    webhookId: string,
    processingStatus: 'failed' | 'processed',
    processedAt: string,
  ): Promise<RecordedPayoutWebhookEvent>;
  recordReceived(
    context: TransactionContext,
    payload: PayoutWebhook,
    webhookId: string,
    receivedAt: string,
  ): Promise<RecordedPayoutWebhookEvent | null>;
}

export const PAYOUT_WEBHOOK_STORE = Symbol('PAYOUT_WEBHOOK_STORE');
