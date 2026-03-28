export type AdminWebhookEventView = {
  eventType: string;
  externalEventId: string;
  id: string;
  linkedPayoutId: string | null;
  linkedTransactionId: string | null;
  payload: Record<string, unknown>;
  processingStatus: string;
  processedAt: Date | string | null;
  provider: string;
  receivedAt: Date | string;
};

export type AdminReconciliationExceptionView = {
  kind: 'ledger_integrity' | 'payout_failed' | 'webhook_processing';
  linkedLedgerTransactionId: string | null;
  linkedPayoutId: string | null;
  linkedTransactionId: string | null;
  linkedWebhookEventId: string | null;
  occurredAt: Date | string;
  reference: string | null;
  severity: 'high' | 'medium';
  sourceId: string;
  summary: string;
};

export interface AdminOperationsQueryRepository {
  listReconciliationExceptions(): Promise<AdminReconciliationExceptionView[]>;
  listWebhookEvents(): Promise<AdminWebhookEventView[]>;
}

export const ADMIN_OPERATIONS_QUERY_REPOSITORY = Symbol('ADMIN_OPERATIONS_QUERY_REPOSITORY');
