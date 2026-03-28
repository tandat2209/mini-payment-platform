import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { LedgerAccountService } from '../../ledger/application/ledger-account.service';
import { LedgerPostingService } from '../../ledger/application/ledger-posting.service';
import {
  TRANSACTION_MANAGER,
  type TransactionContext,
  type TransactionManager,
} from '../../shared/application/transaction-manager';
import { toStructuredLog } from '../../shared/logging/structured-log';
import { PAYOUT_WEBHOOK_STORE, type PayoutWebhookStore } from '../domain/payout-webhook.store';
import {
  type PayoutWebhook,
  type RecordedPayoutWebhookEvent,
} from '../domain/payout-webhook.types';
import {
  PAYOUT_WALLET_REPOSITORY,
  PAYOUT_WRITE_REPOSITORY,
  type PayoutExecutionRecord,
  type PayoutWalletRepository,
  type PayoutWriteRepository,
} from '../domain/payout-write.repositories';

type OutcomeTransitionDecision = 'apply' | 'noop' | 'reject';
type OutcomeProcessingStatus = 'failed' | 'processed';
type PayoutOutcomeStatus = PayoutWebhook['data']['status'];

@Injectable()
export class ApplyPayoutWebhookService {
  private readonly logger = new Logger(ApplyPayoutWebhookService.name);

  constructor(
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
    @Inject(PAYOUT_WEBHOOK_STORE)
    private readonly payoutWebhookStore: PayoutWebhookStore,
    @Inject(PAYOUT_WALLET_REPOSITORY)
    private readonly payoutWalletRepository: PayoutWalletRepository,
    @Inject(PAYOUT_WRITE_REPOSITORY)
    private readonly payoutWriteRepository: PayoutWriteRepository,
    private readonly ledgerAccountService: LedgerAccountService,
    private readonly ledgerPostingService: LedgerPostingService,
  ) {}

  async execute(payload: PayoutWebhook): Promise<RecordedPayoutWebhookEvent> {
    this.logger.log(
      toStructuredLog({
        event: 'payout_webhook_processing_started',
        externalEventId: payload.externalEventId,
        externalPayoutId: payload.data.externalPayoutId,
        provider: payload.provider,
        status: payload.data.status,
      }),
    );

    return await this.transactionManager.runInTransaction(async (context) => {
      const webhookId = randomUUID();
      const now = new Date().toISOString();
      const insertedRow = await this.payoutWebhookStore.recordReceived(
        context,
        payload,
        webhookId,
        now,
      );

      if (!insertedRow) {
        const existingEvent = await this.payoutWebhookStore.findByProviderEvent(
          context,
          payload.provider,
          payload.externalEventId,
        );

        if (!existingEvent) {
          throw new Error('Payout webhook event could not be loaded after duplicate detection');
        }

        this.logger.warn(
          toStructuredLog({
            event: 'payout_webhook_duplicate_detected',
            externalEventId: payload.externalEventId,
            externalPayoutId: payload.data.externalPayoutId,
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

      const executionRecord = await this.payoutWriteRepository.findExecutionByProviderPayoutId(
        context,
        {
          externalPayoutId: payload.data.externalPayoutId,
          provider: payload.provider,
        },
      );

      if (!executionRecord) {
        this.logger.warn(
          toStructuredLog({
            event: 'payout_webhook_attempt_not_found',
            externalEventId: payload.externalEventId,
            externalPayoutId: payload.data.externalPayoutId,
            provider: payload.provider,
            webhookEventId: insertedRow.id,
          }),
        );

        return await this.payoutWebhookStore.markProcessingStatus(
          context,
          insertedRow.id,
          'failed',
          now,
        );
      }

      const processingStatus = await this.applyOutcome(
        context,
        insertedRow.id,
        executionRecord,
        payload,
      );

      this.logger.log(
        toStructuredLog({
          event: 'payout_webhook_processed',
          externalEventId: payload.externalEventId,
          externalPayoutId: payload.data.externalPayoutId,
          payoutId: executionRecord.payoutId,
          processingStatus,
          provider: payload.provider,
          status: payload.data.status,
          webhookEventId: insertedRow.id,
        }),
      );

      return await this.payoutWebhookStore.markProcessingStatus(
        context,
        insertedRow.id,
        processingStatus,
        now,
      );
    });
  }

  private async applyOutcome(
    context: TransactionContext,
    webhookEventId: string,
    executionRecord: PayoutExecutionRecord,
    payload: PayoutWebhook,
  ): Promise<OutcomeProcessingStatus> {
    const decision = classifyTransition(executionRecord, payload.data.status);

    if (decision === 'noop') {
      return 'processed';
    }

    if (decision === 'reject') {
      return 'failed';
    }

    if (payload.data.status === 'processing') {
      return await this.handleProcessingOutcome(context, executionRecord, payload);
    }

    if (payload.data.status === 'paid') {
      return await this.handlePaidOutcome(context, webhookEventId, executionRecord, payload);
    }

    return await this.handleFailedOutcome(context, webhookEventId, executionRecord, payload);
  }

  private async handleProcessingOutcome(
    context: TransactionContext,
    executionRecord: PayoutExecutionRecord,
    payload: PayoutWebhook,
  ): Promise<OutcomeProcessingStatus> {
    await this.recordAttemptOutcome(context, {
      attemptId: executionRecord.attemptId,
      payload,
      status: 'processing',
    });
    await this.payoutWriteRepository.markPayoutAsProcessing(context, {
      payoutId: executionRecord.payoutId,
      updatedAt: payload.occurredAt,
    });

    return 'processed';
  }

  private async handlePaidOutcome(
    context: TransactionContext,
    webhookEventId: string,
    executionRecord: PayoutExecutionRecord,
    payload: PayoutWebhook,
  ): Promise<OutcomeProcessingStatus> {
    const recipientPayableAccountId = await this.ledgerAccountService.ensureRecipientPayableAccount(
      context,
      executionRecord.recipientId,
      executionRecord.currency,
      payload.occurredAt,
    );
    const platformCashAccountId = await this.ledgerAccountService.ensurePlatformCashAccount(
      context,
      executionRecord.currency,
      payload.occurredAt,
    );

    await this.ledgerPostingService.createPostedTransaction(context, {
      currency: executionRecord.currency,
      description: buildSettlementLedgerDescription(executionRecord.payoutReference),
      entries: [
        {
          amountMinor: executionRecord.netAmountMinor,
          currency: executionRecord.currency,
          description: 'Recipient payable cleared on payout settlement',
          direction: 'debit',
          ledgerAccountId: recipientPayableAccountId,
        },
        {
          amountMinor: executionRecord.netAmountMinor,
          currency: executionRecord.currency,
          description: 'Platform cash reduced on payout settlement',
          direction: 'credit',
          ledgerAccountId: platformCashAccountId,
        },
      ],
      postedAt: payload.occurredAt,
      reference: executionRecord.payoutReference,
      transactionType: 'payout_settlement',
      webhookEventId,
    });

    await this.recordAttemptOutcome(context, {
      attemptId: executionRecord.attemptId,
      payload,
      resolvedAt: payload.occurredAt,
      status: 'succeeded',
    });
    await this.payoutWriteRepository.markPayoutAsPaid(context, {
      completedAt: payload.occurredAt,
      payoutId: executionRecord.payoutId,
      updatedAt: payload.occurredAt,
      userTransactionId: executionRecord.userTransactionId,
      webhookEventId,
    });

    return 'processed';
  }

  private async handleFailedOutcome(
    context: TransactionContext,
    webhookEventId: string,
    executionRecord: PayoutExecutionRecord,
    payload: PayoutWebhook,
  ): Promise<OutcomeProcessingStatus> {
    await this.payoutWalletRepository.creditAvailableBalance(context, {
      amountMinor: executionRecord.grossAmountMinor,
      currency: executionRecord.currency,
      updatedAt: payload.occurredAt,
      walletId: executionRecord.walletId,
    });

    const walletLiabilityAccountId = await this.ledgerAccountService.ensureWalletLiabilityAccount(
      context,
      executionRecord.walletId,
      executionRecord.currency,
      payload.occurredAt,
    );
    const recipientPayableAccountId = await this.ledgerAccountService.ensureRecipientPayableAccount(
      context,
      executionRecord.recipientId,
      executionRecord.currency,
      payload.occurredAt,
    );
    const platformRevenueAccountId = await this.ledgerAccountService.ensurePlatformRevenueAccount(
      context,
      executionRecord.currency,
      payload.occurredAt,
    );

    await this.ledgerPostingService.createPostedTransaction(context, {
      currency: executionRecord.currency,
      description: buildFailureLedgerDescription(
        executionRecord.payoutReference,
        payload.data.failureReason,
      ),
      entries: [
        {
          amountMinor: executionRecord.netAmountMinor,
          currency: executionRecord.currency,
          description: 'Recipient payable reversed after payout failure',
          direction: 'debit',
          ledgerAccountId: recipientPayableAccountId,
        },
        {
          amountMinor: executionRecord.feeAmountMinor,
          currency: executionRecord.currency,
          description: 'Platform revenue reversed after payout failure',
          direction: 'debit',
          ledgerAccountId: platformRevenueAccountId,
        },
        {
          amountMinor: executionRecord.grossAmountMinor,
          currency: executionRecord.currency,
          description: 'Wallet liability restored after payout failure',
          direction: 'credit',
          ledgerAccountId: walletLiabilityAccountId,
        },
      ],
      postedAt: payload.occurredAt,
      reference: executionRecord.payoutReference,
      transactionType: 'reversal',
      webhookEventId,
    });

    await this.recordAttemptOutcome(context, {
      attemptId: executionRecord.attemptId,
      payload,
      resolvedAt: payload.occurredAt,
      status: 'failed',
    });
    await this.payoutWriteRepository.markPayoutAsFailed(context, {
      failedAt: payload.occurredAt,
      payoutId: executionRecord.payoutId,
      updatedAt: payload.occurredAt,
      userTransactionId: executionRecord.userTransactionId,
      webhookEventId,
    });

    return 'processed';
  }

  private async recordAttemptOutcome(
    context: TransactionContext,
    input: {
      attemptId: string;
      payload: PayoutWebhook;
      resolvedAt?: string;
      status: 'failed' | 'processing' | 'succeeded';
    },
  ): Promise<void> {
    await this.payoutWriteRepository.updateAttemptOutcome(context, {
      attemptId: input.attemptId,
      ...(input.resolvedAt === undefined ? {} : { resolvedAt: input.resolvedAt }),
      responsePayload: toWebhookPayloadRecord(input.payload),
      status: input.status,
    });
  }
}

function classifyTransition(
  executionRecord: PayoutExecutionRecord,
  incomingStatus: PayoutOutcomeStatus,
): OutcomeTransitionDecision {
  if (incomingStatus === 'processing') {
    if (executionRecord.payoutStatus === 'paid' || executionRecord.payoutStatus === 'failed') {
      return 'noop';
    }

    return 'apply';
  }

  if (incomingStatus === 'paid') {
    if (executionRecord.payoutStatus === 'paid' || executionRecord.attemptStatus === 'succeeded') {
      return 'noop';
    }

    if (executionRecord.payoutStatus === 'failed') {
      return 'reject';
    }

    return 'apply';
  }

  if (executionRecord.payoutStatus === 'failed' || executionRecord.attemptStatus === 'failed') {
    return 'noop';
  }

  if (executionRecord.payoutStatus === 'paid') {
    return 'reject';
  }

  return 'apply';
}

function toWebhookPayloadRecord(payload: PayoutWebhook): Record<string, unknown> {
  return payload as unknown as Record<string, unknown>;
}

function buildSettlementLedgerDescription(reference: string | null): string {
  if (reference) {
    return `Settle payout ${reference}`;
  }

  return 'Settle payout';
}

function buildFailureLedgerDescription(reference: string | null, failureReason?: string): string {
  if (reference && failureReason) {
    return `Reverse payout ${reference} (${failureReason})`;
  }

  if (reference) {
    return `Reverse payout ${reference}`;
  }

  if (failureReason) {
    return `Reverse payout (${failureReason})`;
  }

  return 'Reverse payout';
}
