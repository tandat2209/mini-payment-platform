export type ReconciliationReportLine =
  | {
      currency: string;
      customerExternalRef: string;
      eventTimestamp: string;
      externalEventId: string;
      feeAmountMinor: number;
      grossAmountMinor: number;
      internalReference: string | null;
      lineId: string;
      lineType: 'funding';
      netAmountMinor: number;
      providerReference: string | null;
      status: 'completed';
      walletId: string;
    }
  | {
      currency: string;
      customerExternalRef: string;
      eventTimestamp: string;
      externalPayoutId: string;
      externalRequestId: string;
      feeAmountMinor: number;
      grossAmountMinor: number;
      internalReference: string | null;
      lineId: string;
      lineType: 'payout';
      netAmountMinor: number;
      payoutId: string;
      recipientName: string | null;
      status: 'failed' | 'paid' | 'processing' | 'submitted';
      walletId: string;
    }
  | {
      currency: string;
      customerExternalRef: string;
      eventTimestamp: string;
      externalPayoutId: string;
      externalRequestId: string;
      feeAmountMinor: number;
      grossAmountMinor: number;
      internalReference: string | null;
      lineId: string;
      lineType: 'return';
      netAmountMinor: number;
      payoutId: string;
      returnedAmountMinor: number;
      status: 'returned';
      walletId: string;
    };

export type ReconciliationReportSimulationRequest = {
  externalEventId?: string;
  providerReportId?: string;
  reportDate: string;
};

export type ReconciliationReportSimulationResponse = {
  delivered: true;
  deliveryTarget: string;
  externalEventId: string;
  payload: {
    data: {
      lineCount: number;
      lines: ReconciliationReportLine[];
      providerReportId: string;
      reportDate: string;
      reportWindowEnd: string;
      reportWindowStart: string;
    };
    eventType: 'reconciliation.report.generated';
    externalEventId: string;
    occurredAt: string;
    provider: 'psp_sandbox';
  };
  receiverResponse: Record<string, unknown>;
};
