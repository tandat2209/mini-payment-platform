import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { LedgerAccountService } from '../../ledger/application/ledger-account.service';
import { LedgerPostingService } from '../../ledger/application/ledger-posting.service';
import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from '../../shared/application/transaction-manager';
import { toStructuredLog } from '../../shared/logging/structured-log';
import {
  FUNDING_TARGET_REPOSITORY,
  FUNDING_TRANSACTION_WRITER,
  FUNDING_WEBHOOK_STORE,
  type FundingTargetRepository,
  type FundingTransactionWriter,
  type FundingWebhookStore,
  WALLET_BALANCE_WRITER,
  type WalletBalanceWriter,
} from '../domain/funding.repositories';
import { type FundingWebhook, type RecordedWebhookEvent } from '../domain/funding.types';

@Injectable()
export class ApplyInboundFundingService {
  private readonly logger = new Logger(ApplyInboundFundingService.name);

  constructor(
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
    @Inject(FUNDING_WEBHOOK_STORE)
    private readonly fundingWebhookStore: FundingWebhookStore,
    @Inject(FUNDING_TARGET_REPOSITORY)
    private readonly fundingTargetRepository: FundingTargetRepository,
    @Inject(WALLET_BALANCE_WRITER)
    private readonly walletBalanceWriter: WalletBalanceWriter,
    @Inject(FUNDING_TRANSACTION_WRITER)
    private readonly fundingTransactionWriter: FundingTransactionWriter,
    private readonly ledgerAccountService: LedgerAccountService,
    private readonly ledgerPostingService: LedgerPostingService,
  ) {}

  async execute(payload: FundingWebhook): Promise<RecordedWebhookEvent> {
    this.logger.log(
      toStructuredLog({
        amountMinor: payload.data.amountMinor,
        currency: payload.data.currency,
        destinationIdentifier: payload.data.destinationIdentifier,
        destinationType: payload.data.destinationType,
        event: 'funding_processing_started',
        externalEventId: payload.externalEventId,
        provider: payload.provider,
      }),
    );

    return await this.transactionManager.runInTransaction(async (context) => {
      const webhookId = randomUUID();
      const now = new Date().toISOString();
      const insertedRow = await this.fundingWebhookStore.recordReceived(
        context,
        payload,
        webhookId,
        now,
      );

      if (!insertedRow) {
        const existingEvent = await this.fundingWebhookStore.findByProviderEvent(
          context,
          payload.provider,
          payload.externalEventId,
        );

        if (!existingEvent) {
          throw new Error('Webhook event could not be loaded after duplicate detection');
        }

        this.logger.warn(
          toStructuredLog({
            event: 'funding_duplicate_detected',
            externalEventId: payload.externalEventId,
            processingStatus: existingEvent.processingStatus,
            provider: payload.provider,
            webhookEventId: existingEvent.id,
          }),
        );

        return {
          ...existingEvent,
          duplicate: true,
        };
      }

      const fundingTarget = await this.fundingTargetRepository.findActiveFundingTarget(
        context,
        payload,
      );

      if (!fundingTarget) {
        this.logger.warn(
          toStructuredLog({
            destinationIdentifier: payload.data.destinationIdentifier,
            destinationType: payload.data.destinationType,
            event: 'funding_target_not_found',
            externalEventId: payload.externalEventId,
            provider: payload.provider,
            webhookEventId: insertedRow.id,
          }),
        );

        return await this.fundingWebhookStore.markProcessingStatus(
          context,
          insertedRow.id,
          'failed',
          now,
        );
      }

      await this.walletBalanceWriter.creditAvailableBalance(context, {
        amountMinor: payload.data.amountMinor,
        currency: payload.data.currency,
        updatedAt: now,
        walletId: fundingTarget.walletId,
      });

      const walletLedgerAccountId = await this.ledgerAccountService.ensureWalletLiabilityAccount(
        context,
        fundingTarget.walletId,
        payload.data.currency,
        now,
      );
      const platformCashLedgerAccountId = await this.ledgerAccountService.ensurePlatformCashAccount(
        context,
        payload.data.currency,
        now,
      );
      const reference = `funding-${payload.externalEventId}`;
      const userTransactionId = await this.fundingTransactionWriter.createFundingTransaction(
        context,
        {
          amountMinor: payload.data.amountMinor,
          currency: payload.data.currency,
          description: buildFundingTransactionDescription(payload),
          occurredAt: payload.occurredAt,
          postedAt: now,
          reference,
          userId: fundingTarget.userId,
          walletId: fundingTarget.walletId,
          webhookEventId: insertedRow.id,
        },
      );

      await this.ledgerPostingService.createPostedTransaction(context, {
        currency: payload.data.currency,
        description: buildLedgerTransactionDescription(payload),
        entries: [
          {
            amountMinor: payload.data.amountMinor,
            currency: payload.data.currency,
            description: 'Provider cash received',
            direction: 'debit',
            ledgerAccountId: platformCashLedgerAccountId,
          },
          {
            amountMinor: payload.data.amountMinor,
            currency: payload.data.currency,
            description: 'Wallet liability increased',
            direction: 'credit',
            ledgerAccountId: walletLedgerAccountId,
          },
        ],
        postedAt: now,
        reference,
        transactionType: 'funding',
        userTransactionId,
        webhookEventId: insertedRow.id,
      });

      this.logger.log(
        toStructuredLog({
          amountMinor: payload.data.amountMinor,
          currency: payload.data.currency,
          event: 'funding_processed',
          externalEventId: payload.externalEventId,
          provider: payload.provider,
          reference,
          userId: fundingTarget.userId,
          userTransactionId,
          walletId: fundingTarget.walletId,
          webhookEventId: insertedRow.id,
        }),
      );

      return await this.fundingWebhookStore.markProcessingStatus(
        context,
        insertedRow.id,
        'processed',
        now,
      );
    });
  }
}

function buildFundingTransactionDescription(payload: FundingWebhook): string {
  const senderName = payload.data.sender?.name?.trim();
  const remittance = payload.data.description?.trim();

  if (senderName && remittance) {
    return `Funding received from ${senderName}: ${remittance}`;
  }

  if (senderName) {
    return `Funding received from ${senderName}`;
  }

  if (remittance) {
    return `Funding received: ${remittance}`;
  }

  return 'Funding received';
}

function buildLedgerTransactionDescription(payload: FundingWebhook): string {
  const providerReference = payload.data.providerReference?.trim();

  if (providerReference) {
    return `Inbound funding recognized from provider webhook (${providerReference})`;
  }

  return 'Inbound funding recognized from funding webhook';
}
