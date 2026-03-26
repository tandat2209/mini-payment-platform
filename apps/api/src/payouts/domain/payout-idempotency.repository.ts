import { type TransactionContext } from '../../shared/application/transaction-manager';
import { type CreatedPayout } from './payout-write.types';

export type ClaimedPayoutIdempotencyKey =
  | {
      id: string;
      result: 'claimed';
    }
  | {
      id: string;
      requestFingerprint: string | null;
      responsePayload: CreatedPayout | null;
      result: 'existing';
      status: 'completed' | 'created' | 'failed';
    };

export interface PayoutIdempotencyRepository {
  claimKey(
    context: TransactionContext,
    input: {
      createdAt: string;
      key: string;
      requestFingerprint: string;
      scope: string;
    },
  ): Promise<ClaimedPayoutIdempotencyKey>;
  markCompleted(
    context: TransactionContext,
    input: {
      id: string;
      responsePayload: CreatedPayout;
      updatedAt: string;
    },
  ): Promise<void>;
}

export const PAYOUT_IDEMPOTENCY_REPOSITORY = Symbol('PAYOUT_IDEMPOTENCY_REPOSITORY');
