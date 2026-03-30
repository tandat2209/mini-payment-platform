import { Inject, Injectable } from '@nestjs/common';

import { type TransactionContext } from '../../shared/application/transaction-manager';
import {
  RECONCILIATION_REPORT_STORE,
  type ReconciliationReportStore,
} from '../domain/reconciliation-report.store';
import {
  type PayoutReconciliationMatchCandidate,
  type ReconciliationExceptionSeverity,
  type ReconciliationLineOutcome,
  type StoredReconciliationReportLine,
} from '../domain/reconciliation-report.types';

type LineClassification = {
  linkedLedgerTransactionId: string | null;
  linkedPayoutAttemptId: string | null;
  linkedPayoutId: string | null;
  linkedTransactionId: string | null;
  linkedWebhookEventId: string | null;
  outcome: ReconciliationLineOutcome;
  severity: ReconciliationExceptionSeverity | null;
  summary: string;
};

@Injectable()
export class ReconciliationLineClassifierService {
  constructor(
    @Inject(RECONCILIATION_REPORT_STORE)
    private readonly reconciliationReportStore: ReconciliationReportStore,
  ) {}

  async classifyBatch(
    context: TransactionContext,
    batchId: string,
    provider: string,
    classifiedAt: string,
  ): Promise<void> {
    const lines = await this.reconciliationReportStore.listBatchLines(context, batchId);

    for (const line of lines) {
      const classification = await this.classifyLine(context, provider, line, batchId);

      await this.reconciliationReportStore.updateLineClassification(context, {
        classifiedAt,
        lineId: line.id,
        linkedLedgerTransactionId: classification.linkedLedgerTransactionId,
        linkedPayoutAttemptId: classification.linkedPayoutAttemptId,
        linkedPayoutId: classification.linkedPayoutId,
        linkedTransactionId: classification.linkedTransactionId,
        linkedWebhookEventId: classification.linkedWebhookEventId,
        outcome: classification.outcome,
        summary: classification.summary,
        updatedAt: classifiedAt,
      });

      if (classification.severity) {
        await this.reconciliationReportStore.upsertException(context, {
          batchId,
          createdAt: classifiedAt,
          lineId: line.id,
          linkedLedgerTransactionId: classification.linkedLedgerTransactionId,
          linkedPayoutAttemptId: classification.linkedPayoutAttemptId,
          linkedPayoutId: classification.linkedPayoutId,
          linkedTransactionId: classification.linkedTransactionId,
          linkedWebhookEventId: classification.linkedWebhookEventId,
          outcome: classification.outcome,
          severity: classification.severity,
          summary: classification.summary,
          updatedAt: classifiedAt,
        });
      } else {
        await this.reconciliationReportStore.deleteExceptionForLine(context, line.id);
      }
    }
  }

  private async classifyLine(
    context: TransactionContext,
    provider: string,
    line: StoredReconciliationReportLine,
    batchId: string,
  ): Promise<LineClassification> {
    const duplicate = await this.reconciliationReportStore.findDuplicateProviderLine(
      context,
      provider,
      line.providerLineId,
      batchId,
    );

    if (duplicate) {
      return {
        linkedLedgerTransactionId: null,
        linkedPayoutAttemptId: null,
        linkedPayoutId: null,
        linkedTransactionId: null,
        linkedWebhookEventId: null,
        outcome: 'duplicate_provider_line',
        severity: 'medium',
        summary: `Provider line ${line.providerLineId} already appeared in an earlier report`,
      };
    }

    if (line.lineType === 'funding') {
      return await this.classifyFundingLine(context, provider, line);
    }

    if (line.lineType === 'payout') {
      return await this.classifyPayoutLine(context, provider, line);
    }

    if (line.lineType === 'return') {
      return await this.classifyReturnLine(context, provider, line);
    }

    return {
      linkedLedgerTransactionId: null,
      linkedPayoutAttemptId: null,
      linkedPayoutId: null,
      linkedTransactionId: null,
      linkedWebhookEventId: null,
      outcome: 'unsupported_report_line',
      severity: 'medium',
      summary: `Unsupported reconciliation line type ${line.lineType}`,
    };
  }

  private async classifyFundingLine(
    context: TransactionContext,
    provider: string,
    line: StoredReconciliationReportLine,
  ): Promise<LineClassification> {
    if (!line.externalEventId) {
      return {
        linkedLedgerTransactionId: null,
        linkedPayoutAttemptId: null,
        linkedPayoutId: null,
        linkedTransactionId: null,
        linkedWebhookEventId: null,
        outcome: 'provider_only',
        severity: 'high',
        summary: 'Funding report line is missing a provider event identifier',
      };
    }

    const candidate = await this.reconciliationReportStore.findFundingMatchCandidate(
      context,
      provider,
      line.externalEventId,
    );

    if (!candidate) {
      return {
        linkedLedgerTransactionId: null,
        linkedPayoutAttemptId: null,
        linkedPayoutId: null,
        linkedTransactionId: null,
        linkedWebhookEventId: null,
        outcome: 'provider_only',
        severity: 'high',
        summary: `Provider reported funding ${line.externalEventId}, but no internal funding record was found`,
      };
    }

    if (
      hasAmountMismatch(line, {
        currency: candidate.currency,
        feeAmountMinor: candidate.feeAmountMinor,
        grossAmountMinor: candidate.grossAmountMinor,
        netAmountMinor: candidate.netAmountMinor,
      })
    ) {
      return {
        linkedLedgerTransactionId: candidate.ledgerTransactionId,
        linkedPayoutAttemptId: null,
        linkedPayoutId: null,
        linkedTransactionId: candidate.userTransactionId,
        linkedWebhookEventId: candidate.webhookEventId,
        outcome: 'amount_mismatch',
        severity: 'high',
        summary: `Funding ${line.providerLineId} differs from the internal amount or currency`,
      };
    }

    if (
      candidate.webhookProcessingStatus !== 'processed' ||
      candidate.userTransactionStatus !== 'completed' ||
      !candidate.ledgerTransactionId ||
      candidate.ledgerTransactionStatus !== 'posted'
    ) {
      return {
        linkedLedgerTransactionId: candidate.ledgerTransactionId,
        linkedPayoutAttemptId: null,
        linkedPayoutId: null,
        linkedTransactionId: candidate.userTransactionId,
        linkedWebhookEventId: candidate.webhookEventId,
        outcome: 'status_mismatch',
        severity: 'high',
        summary: `Funding ${line.providerLineId} exists internally, but its processing or ledger follow-up is incomplete`,
      };
    }

    return {
      linkedLedgerTransactionId: candidate.ledgerTransactionId,
      linkedPayoutAttemptId: null,
      linkedPayoutId: null,
      linkedTransactionId: candidate.userTransactionId,
      linkedWebhookEventId: candidate.webhookEventId,
      outcome: 'matched',
      severity: null,
      summary: `Funding ${line.providerLineId} matches the internal funding records`,
    };
  }

  private async classifyPayoutLine(
    context: TransactionContext,
    provider: string,
    line: StoredReconciliationReportLine,
  ): Promise<LineClassification> {
    const candidate = await this.findPayoutCandidate(context, provider, line);

    if (!candidate) {
      return {
        linkedLedgerTransactionId: null,
        linkedPayoutAttemptId: null,
        linkedPayoutId: null,
        linkedTransactionId: null,
        linkedWebhookEventId: null,
        outcome: 'provider_only',
        severity: 'high',
        summary: `Provider reported payout ${line.providerLineId}, but no internal payout attempt was found`,
      };
    }

    if (
      hasAmountMismatch(line, {
        currency: candidate.currency,
        feeAmountMinor: candidate.feeAmountMinor,
        grossAmountMinor: candidate.grossAmountMinor,
        netAmountMinor: candidate.netAmountMinor,
      })
    ) {
      return this.withPayoutLinks(
        candidate,
        'amount_mismatch',
        'high',
        (lineId) => `Payout ${lineId} differs from the internal gross, fee, net, or currency`,
      )(line.providerLineId);
    }

    if (line.lineStatus === 'submitted' || line.lineStatus === 'processing') {
      if (candidate.payoutStatus === line.lineStatus) {
        return this.withPayoutLinks(
          candidate,
          'matched',
          null,
          (lineId) => `Payout ${lineId} matches the internal in-flight payout state`,
        )(line.providerLineId);
      }

      if (isInFlightPayoutStatus(candidate.payoutStatus)) {
        return this.withPayoutLinks(
          candidate,
          'timing_difference',
          'medium',
          (lineId) =>
            `Payout ${lineId} is still in flight internally and looks like a timing difference`,
        )(line.providerLineId);
      }

      return this.withPayoutLinks(
        candidate,
        'status_mismatch',
        'high',
        (lineId) =>
          `Payout ${lineId} has a provider status that conflicts with the internal payout state`,
      )(line.providerLineId);
    }

    if (line.lineStatus === 'paid') {
      if (candidate.payoutStatus === 'paid' && candidate.settlementLedgerTransactionId) {
        return this.withPayoutLinks(
          candidate,
          'matched',
          null,
          (lineId) => `Payout ${lineId} matches the internal paid state and settlement ledger`,
        )(line.providerLineId);
      }

      if (isInFlightPayoutStatus(candidate.payoutStatus)) {
        return this.withPayoutLinks(
          candidate,
          'timing_difference',
          'medium',
          (lineId) =>
            `Payout ${lineId} looks paid at the provider but is still in flight internally`,
        )(line.providerLineId);
      }

      return this.withPayoutLinks(
        candidate,
        'status_mismatch',
        'high',
        (lineId) =>
          `Payout ${lineId} conflicts with internal paid-state or settlement-ledger expectations`,
      )(line.providerLineId);
    }

    if (line.lineStatus === 'failed') {
      if (candidate.payoutStatus === 'failed' && candidate.reversalLedgerTransactionId) {
        return this.withPayoutLinks(
          candidate,
          'matched',
          null,
          (lineId) => `Payout ${lineId} matches the internal failed state and reversal ledger`,
        )(line.providerLineId);
      }

      if (isInFlightPayoutStatus(candidate.payoutStatus)) {
        return this.withPayoutLinks(
          candidate,
          'timing_difference',
          'medium',
          (lineId) =>
            `Payout ${lineId} looks failed at the provider but is still in flight internally`,
        )(line.providerLineId);
      }

      return this.withPayoutLinks(
        candidate,
        'status_mismatch',
        'high',
        (lineId) =>
          `Payout ${lineId} conflicts with internal failed-state or reversal-ledger expectations`,
      )(line.providerLineId);
    }

    return this.withPayoutLinks(
      candidate,
      'unsupported_report_line',
      'medium',
      (lineId) => `Payout ${lineId} uses an unsupported provider payout status ${line.lineStatus}`,
    )(line.providerLineId);
  }

  private async classifyReturnLine(
    context: TransactionContext,
    provider: string,
    line: StoredReconciliationReportLine,
  ): Promise<LineClassification> {
    const candidate = await this.findPayoutCandidate(context, provider, line);

    if (!candidate) {
      return {
        linkedLedgerTransactionId: null,
        linkedPayoutAttemptId: null,
        linkedPayoutId: null,
        linkedTransactionId: null,
        linkedWebhookEventId: null,
        outcome: 'provider_only',
        severity: 'high',
        summary: `Provider reported return ${line.providerLineId}, but no internal payout attempt was found`,
      };
    }

    if (
      hasAmountMismatch(line, {
        currency: candidate.currency,
        feeAmountMinor: candidate.feeAmountMinor,
        grossAmountMinor: candidate.grossAmountMinor,
        netAmountMinor: candidate.netAmountMinor,
      }) ||
      line.returnedAmountMinor !== candidate.returnedAmountMinor
    ) {
      return this.withPayoutLinks(
        candidate,
        'amount_mismatch',
        'high',
        (lineId) =>
          `Returned payout ${lineId} differs from the internal returned amount or payout amounts`,
      )(line.providerLineId);
    }

    if (
      candidate.payoutStatus === 'returned' &&
      candidate.reversalLedgerTransactionId &&
      candidate.returnCreditTransactionId
    ) {
      return this.withPayoutLinks(
        candidate,
        'matched',
        null,
        (lineId) =>
          `Returned payout ${lineId} matches the internal returned state and compensating records`,
      )(line.providerLineId);
    }

    if (candidate.payoutStatus === 'paid') {
      return this.withPayoutLinks(
        candidate,
        'timing_difference',
        'medium',
        (lineId) =>
          `Returned payout ${lineId} is still only paid internally and looks like a timing difference`,
      )(line.providerLineId);
    }

    return this.withPayoutLinks(
      candidate,
      'status_mismatch',
      'high',
      (lineId) => `Returned payout ${lineId} conflicts with internal returned-state expectations`,
    )(line.providerLineId);
  }

  private async findPayoutCandidate(
    context: TransactionContext,
    provider: string,
    line: StoredReconciliationReportLine,
  ): Promise<PayoutReconciliationMatchCandidate | null> {
    return await this.reconciliationReportStore.findPayoutMatchCandidate(context, {
      externalPayoutId: line.externalPayoutId ?? '',
      externalRequestId: line.externalRequestId ?? '',
      payoutId: line.payoutId ?? '',
      provider,
    });
  }

  private withPayoutLinks(
    candidate: PayoutReconciliationMatchCandidate,
    outcome: ReconciliationLineOutcome,
    severity: ReconciliationExceptionSeverity | null,
    summary: (providerLineId: string) => string,
  ): (providerLineId: string) => LineClassification {
    return (providerLineId) => ({
      linkedLedgerTransactionId:
        candidate.reversalLedgerTransactionId ?? candidate.settlementLedgerTransactionId,
      linkedPayoutAttemptId: candidate.payoutAttemptId,
      linkedPayoutId: candidate.payoutId,
      linkedTransactionId: candidate.userTransactionId,
      linkedWebhookEventId: candidate.webhookEventId,
      outcome,
      severity,
      summary: summary(providerLineId),
    });
  }
}

function hasAmountMismatch(
  line: StoredReconciliationReportLine,
  candidate: {
    currency: string | null;
    feeAmountMinor: number | null;
    grossAmountMinor: number | null;
    netAmountMinor: number | null;
  },
): boolean {
  return (
    candidate.currency !== line.currency ||
    candidate.grossAmountMinor !== line.grossAmountMinor ||
    candidate.feeAmountMinor !== line.feeAmountMinor ||
    candidate.netAmountMinor !== line.netAmountMinor
  );
}

function isInFlightPayoutStatus(status: string): boolean {
  return status === 'pending_submission' || status === 'submitted' || status === 'processing';
}
