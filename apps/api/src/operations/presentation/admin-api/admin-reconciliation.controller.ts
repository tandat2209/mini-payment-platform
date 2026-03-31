import { Controller, Get } from '@nestjs/common';

import { toIsoTimestamp, toMoneyDto } from '../../../shared/api/api-primitives';
import { GetAdminOperationsQuery } from '../../application/get-admin-operations.query';

@Controller('admin/reconciliation')
export class AdminReconciliationController {
  constructor(private readonly getAdminOperationsQuery: GetAdminOperationsQuery) {}

  @Get('reports')
  async listReports(): Promise<{
    items: Array<{
      exceptionCount: number;
      id: string;
      lineCount: number;
      matchedCount: number;
      processedAt: string | null;
      processingStatus: string;
      provider: string;
      providerReportId: string;
      receivedAt: string | null;
      reportDate: string | null;
      reportWindowEnd: string | null;
      reportWindowStart: string | null;
    }>;
  }> {
    const items = await this.getAdminOperationsQuery.listReconciliationReportBatches();

    return {
      items: items.map((item) => ({
        exceptionCount: item.exceptionCount,
        id: item.id,
        lineCount: item.lineCount,
        matchedCount: item.matchedCount,
        processedAt: toIsoTimestamp(item.processedAt),
        processingStatus: item.processingStatus,
        provider: item.provider,
        providerReportId: item.providerReportId,
        receivedAt: toIsoTimestamp(item.receivedAt),
        reportDate: toIsoTimestamp(item.reportDate),
        reportWindowEnd: toIsoTimestamp(item.reportWindowEnd),
        reportWindowStart: toIsoTimestamp(item.reportWindowStart),
      })),
    };
  }

  @Get('lines')
  async listReportLines(): Promise<{
    items: Array<{
      amounts: {
        fee: ReturnType<typeof toMoneyDto>;
        gross: ReturnType<typeof toMoneyDto>;
        net: ReturnType<typeof toMoneyDto>;
        returned: ReturnType<typeof toMoneyDto> | null;
      };
      batchId: string;
      customerExternalRef: string;
      eventTimestamp: string | null;
      externalEventId: string | null;
      externalPayoutId: string | null;
      externalRequestId: string | null;
      id: string;
      internalMatchPayload: Record<string, unknown> | null;
      linkedLedgerTransactionId: string | null;
      linkedPayoutId: string | null;
      linkedTransactionId: string | null;
      linkedWebhookEventId: string | null;
      outcome: string | null;
      outcomeSummary: string | null;
      providerLineId: string;
      providerReportId: string;
      rawReportPayload: Record<string, unknown>;
      severity: string | null;
      status: string;
      type: string;
    }>;
  }> {
    const items = await this.getAdminOperationsQuery.listReconciliationReportLines();

    return {
      items: items.map((item) => ({
        amounts: {
          fee: toMoneyDto(item.currency, item.feeAmountMinor),
          gross: toMoneyDto(item.currency, item.grossAmountMinor),
          net: toMoneyDto(item.currency, item.netAmountMinor),
          returned: item.returnedAmountMinor
            ? toMoneyDto(item.currency, item.returnedAmountMinor)
            : null,
        },
        batchId: item.batchId,
        customerExternalRef: item.customerExternalRef,
        eventTimestamp: toIsoTimestamp(item.eventTimestamp),
        externalEventId: item.externalEventId,
        externalPayoutId: item.externalPayoutId,
        externalRequestId: item.externalRequestId,
        id: item.id,
        internalMatchPayload: item.internalMatchPayload,
        linkedLedgerTransactionId: item.linkedLedgerTransactionId,
        linkedPayoutId: item.linkedPayoutId,
        linkedTransactionId: item.linkedTransactionId,
        linkedWebhookEventId: item.linkedWebhookEventId,
        outcome: item.outcome,
        outcomeSummary: item.outcomeSummary,
        providerLineId: item.providerLineId,
        providerReportId: item.providerReportId,
        rawReportPayload: item.rawReportPayload,
        severity: item.severity,
        status: item.status,
        type: item.type,
      })),
    };
  }

  @Get('exceptions')
  async listExceptions(): Promise<{
    items: Array<{
      kind: string;
      linkedLedgerTransactionId: string | null;
      linkedPayoutId: string | null;
      linkedTransactionId: string | null;
      linkedWebhookEventId: string | null;
      occurredAt: string | null;
      reference: string | null;
      severity: string;
      sourceId: string;
      summary: string;
    }>;
  }> {
    const items = await this.getAdminOperationsQuery.listReconciliationExceptions();

    return {
      items: items.map((item) => ({
        kind: item.kind,
        linkedLedgerTransactionId: item.linkedLedgerTransactionId,
        linkedPayoutId: item.linkedPayoutId,
        linkedTransactionId: item.linkedTransactionId,
        linkedWebhookEventId: item.linkedWebhookEventId,
        occurredAt: toIsoTimestamp(item.occurredAt),
        reference: item.reference,
        severity: item.severity,
        sourceId: item.sourceId,
        summary: item.summary,
      })),
    };
  }
}
