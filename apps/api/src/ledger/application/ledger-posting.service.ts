import { Inject, Injectable } from '@nestjs/common';

import { type TransactionContext } from '../../shared/application/transaction-manager';
import {
  LEDGER_POSTING_REPOSITORY,
  type LedgerPostingRepository,
} from '../domain/ledger.repositories';
import { type CreatePostedLedgerTransactionInput } from '../domain/ledger.types';

@Injectable()
export class LedgerPostingService {
  constructor(
    @Inject(LEDGER_POSTING_REPOSITORY)
    private readonly ledgerPostingRepository: LedgerPostingRepository,
  ) {}

  async createPostedTransaction(
    context: TransactionContext,
    input: CreatePostedLedgerTransactionInput,
  ): Promise<string> {
    this.assertBalanced(input);

    return await this.ledgerPostingRepository.createPostedTransaction(context, input);
  }

  private assertBalanced(input: CreatePostedLedgerTransactionInput): void {
    if (input.entries.length < 2) {
      throw new Error('Ledger posting requires at least two entries');
    }

    let debitTotal = 0;
    let creditTotal = 0;

    for (const entry of input.entries) {
      if (entry.currency !== input.currency) {
        throw new Error('Ledger entry currency must match transaction currency');
      }

      if (!Number.isInteger(entry.amountMinor) || entry.amountMinor <= 0) {
        throw new Error('Ledger entry amount must be a positive integer');
      }

      if (entry.direction === 'debit') {
        debitTotal += entry.amountMinor;
      } else {
        creditTotal += entry.amountMinor;
      }
    }

    if (debitTotal !== creditTotal) {
      throw new Error('Ledger transaction must balance debits and credits');
    }
  }
}
