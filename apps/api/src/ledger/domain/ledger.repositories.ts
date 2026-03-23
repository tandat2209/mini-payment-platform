import { type TransactionContext } from '../../shared/application/transaction-manager';
import { type CreatePostedLedgerTransactionInput } from './ledger.types';

export interface LedgerAccountRepository {
  createPlatformCashAccount(
    context: TransactionContext,
    input: {
      code: string;
      currency: string;
      name: string;
      now: string;
    },
  ): Promise<void>;
  createWalletLiabilityAccount(
    context: TransactionContext,
    input: {
      code: string;
      currency: string;
      name: string;
      now: string;
      walletId: string;
    },
  ): Promise<void>;
  findOpenPlatformCashAccount(
    context: TransactionContext,
    currency: string,
  ): Promise<string | null>;
  findOpenWalletLiabilityAccount(
    context: TransactionContext,
    walletId: string,
    currency: string,
  ): Promise<string | null>;
}

export interface LedgerPostingRepository {
  createPostedTransaction(
    context: TransactionContext,
    input: CreatePostedLedgerTransactionInput,
  ): Promise<string>;
}

export const LEDGER_ACCOUNT_REPOSITORY = Symbol('LEDGER_ACCOUNT_REPOSITORY');
export const LEDGER_POSTING_REPOSITORY = Symbol('LEDGER_POSTING_REPOSITORY');
