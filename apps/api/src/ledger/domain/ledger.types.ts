export type LedgerEntryDirection = 'debit' | 'credit';

export type LedgerTransactionType =
  | 'funding'
  | 'payout'
  | 'payout_settlement'
  | 'adjustment'
  | 'reversal';

export type LedgerEntryDraft = {
  amountMinor: number;
  currency: string;
  description: string;
  direction: LedgerEntryDirection;
  ledgerAccountId: string;
};

export type CreatePostedLedgerTransactionInput = {
  currency: string;
  description: string;
  entries: LedgerEntryDraft[];
  postedAt: string;
  reference: string | null;
  transactionType: LedgerTransactionType;
  userTransactionId?: string | null;
  webhookEventId?: string | null;
};
