import { Inject, Injectable } from '@nestjs/common';

import { type TransactionContext } from '../../shared/application/transaction-manager';
import {
  LEDGER_ACCOUNT_REPOSITORY,
  type LedgerAccountRepository,
} from '../domain/ledger.repositories';

@Injectable()
export class LedgerAccountService {
  constructor(
    @Inject(LEDGER_ACCOUNT_REPOSITORY)
    private readonly ledgerAccountRepository: LedgerAccountRepository,
  ) {}

  async ensureWalletLiabilityAccount(
    context: TransactionContext,
    walletId: string,
    currency: string,
    now: string,
  ): Promise<string> {
    const existing = await this.ledgerAccountRepository.findOpenWalletLiabilityAccount(
      context,
      walletId,
      currency,
    );

    if (existing) {
      return existing;
    }

    await this.ledgerAccountRepository.createWalletLiabilityAccount(context, {
      code: `wallet_${walletId.replace(/-/g, '').toLowerCase()}_${currency.toLowerCase()}`,
      currency,
      name: `Wallet Liability ${currency}`,
      now,
      walletId,
    });

    const created = await this.ledgerAccountRepository.findOpenWalletLiabilityAccount(
      context,
      walletId,
      currency,
    );

    if (!created) {
      throw new Error('Wallet ledger account could not be provisioned');
    }

    return created;
  }

  async ensurePlatformCashAccount(
    context: TransactionContext,
    currency: string,
    now: string,
  ): Promise<string> {
    const existing = await this.ledgerAccountRepository.findOpenPlatformCashAccount(
      context,
      currency,
    );

    if (existing) {
      return existing;
    }

    await this.ledgerAccountRepository.createPlatformCashAccount(context, {
      code: `platform_cash_${currency.toLowerCase()}`,
      currency,
      name: `Platform Cash ${currency}`,
      now,
    });

    const created = await this.ledgerAccountRepository.findOpenPlatformCashAccount(
      context,
      currency,
    );

    if (!created) {
      throw new Error('Platform cash ledger account could not be provisioned');
    }

    return created;
  }
}
