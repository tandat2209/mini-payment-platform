export type AdminPayoutListItemView = {
  attemptStatus: string | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
  currency: string;
  customerExternalRef: string;
  customerId: string;
  externalPayoutId: string | null;
  externalRequestId: string | null;
  failedAt: Date | string | null;
  feeAmountMinor: string;
  grossAmountMinor: string;
  id: string;
  latestWebhookEventId: string | null;
  provider: string | null;
  recipientId: string;
  recipientName: string;
  reference: string | null;
  status: string;
  submittedAt: Date | string | null;
  userTransactionId: string;
  walletId: string;
};

export interface AdminPayoutQueryRepository {
  listPayouts(): Promise<AdminPayoutListItemView[]>;
}

export const ADMIN_PAYOUT_QUERY_REPOSITORY = Symbol('ADMIN_PAYOUT_QUERY_REPOSITORY');
