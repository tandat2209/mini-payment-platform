import { type TransactionContext } from '../../shared/application/transaction-manager';

export type OwnedWalletBalance = {
  availableAmountMinor: number;
  walletId: string;
};

export interface PayoutWalletRepository {
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
      userId: string;
      userTransactionId: string;
      walletId: string;
    },
  ): Promise<void>;
}

export const PAYOUT_WALLET_REPOSITORY = Symbol('PAYOUT_WALLET_REPOSITORY');
export const PAYOUT_WRITE_REPOSITORY = Symbol('PAYOUT_WRITE_REPOSITORY');
