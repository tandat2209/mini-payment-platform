import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  type ReconciliationReportLine,
  type ReconciliationReportWebhook,
} from '../domain/reconciliation-report.types';

class ReconciliationReportLineDto {
  @IsString()
  @IsNotEmpty()
  lineId!: string;

  @IsIn(['funding', 'payout', 'return'])
  lineType!: 'funding' | 'payout' | 'return';

  @IsString()
  @Matches(/^[A-Z]{3}$/u)
  currency!: string;

  @IsInt()
  @Min(0)
  grossAmountMinor!: number;

  @IsInt()
  @Min(0)
  feeAmountMinor!: number;

  @IsInt()
  @Min(0)
  netAmountMinor!: number;

  @IsString()
  @IsNotEmpty()
  customerExternalRef!: string;

  @IsString()
  @IsNotEmpty()
  walletId!: string;

  @IsString()
  @IsNotEmpty()
  eventTimestamp!: string;

  @IsOptional()
  @IsString()
  internalReference?: string | null;

  @IsOptional()
  @IsString()
  providerReference?: string | null;

  @IsOptional()
  @IsString()
  externalEventId?: string;

  @IsOptional()
  @IsString()
  externalPayoutId?: string;

  @IsOptional()
  @IsString()
  externalRequestId?: string;

  @IsOptional()
  @IsString()
  payoutId?: string;

  @IsOptional()
  @IsString()
  recipientName?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  returnedAmountMinor?: number;

  @IsString()
  @IsNotEmpty()
  status!: string;

  toDomain(): ReconciliationReportLine {
    return validateAndMapLine(this);
  }
}

class ReconciliationReportDataDto {
  @IsString()
  @IsNotEmpty()
  providerReportId!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/u)
  reportDate!: string;

  @IsString()
  @IsNotEmpty()
  reportWindowStart!: string;

  @IsString()
  @IsNotEmpty()
  reportWindowEnd!: string;

  @IsInt()
  @Min(0)
  lineCount!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReconciliationReportLineDto)
  lines!: ReconciliationReportLineDto[];
}

export class ReconciliationReportWebhookRequestDto {
  @ValidateNested()
  @Type(() => ReconciliationReportDataDto)
  data!: ReconciliationReportDataDto;

  @IsString()
  @IsNotEmpty()
  @IsIn(['reconciliation.report.generated'])
  eventType!: 'reconciliation.report.generated';

  @IsString()
  @IsNotEmpty()
  externalEventId!: string;

  @IsString()
  @IsNotEmpty()
  occurredAt!: string;

  @IsString()
  @IsNotEmpty()
  provider!: string;

  toDomain(): ReconciliationReportWebhook {
    if (this.data.lineCount !== this.data.lines.length) {
      throw new BadRequestException('lineCount must match the number of report lines');
    }

    return {
      data: {
        lineCount: this.data.lineCount,
        lines: this.data.lines.map((line) => line.toDomain()),
        providerReportId: this.data.providerReportId,
        reportDate: this.data.reportDate,
        reportWindowEnd: this.data.reportWindowEnd,
        reportWindowStart: this.data.reportWindowStart,
      },
      eventType: this.eventType,
      externalEventId: this.externalEventId,
      occurredAt: this.occurredAt,
      provider: this.provider,
    };
  }
}

function validateAndMapLine(input: ReconciliationReportLineDto): ReconciliationReportLine {
  if (input.lineType === 'funding') {
    if (!input.externalEventId) {
      throw new BadRequestException('funding report lines require externalEventId');
    }

    if (input.status !== 'completed') {
      throw new BadRequestException('funding report lines must carry completed status');
    }

    return {
      currency: input.currency,
      customerExternalRef: input.customerExternalRef,
      eventTimestamp: input.eventTimestamp,
      externalEventId: input.externalEventId,
      feeAmountMinor: input.feeAmountMinor,
      grossAmountMinor: input.grossAmountMinor,
      internalReference: input.internalReference ?? null,
      lineId: input.lineId,
      lineType: 'funding',
      netAmountMinor: input.netAmountMinor,
      providerReference: input.providerReference ?? null,
      status: 'completed',
      walletId: input.walletId,
    };
  }

  if (!input.externalPayoutId || !input.externalRequestId || !input.payoutId) {
    throw new BadRequestException(
      `${input.lineType} report lines require externalPayoutId, externalRequestId, and payoutId`,
    );
  }

  if (input.lineType === 'return') {
    if (input.status !== 'returned') {
      throw new BadRequestException('return report lines must carry returned status');
    }

    if (input.returnedAmountMinor === undefined) {
      throw new BadRequestException('return report lines require returnedAmountMinor');
    }

    return {
      currency: input.currency,
      customerExternalRef: input.customerExternalRef,
      eventTimestamp: input.eventTimestamp,
      externalPayoutId: input.externalPayoutId,
      externalRequestId: input.externalRequestId,
      feeAmountMinor: input.feeAmountMinor,
      grossAmountMinor: input.grossAmountMinor,
      internalReference: input.internalReference ?? null,
      lineId: input.lineId,
      lineType: 'return',
      netAmountMinor: input.netAmountMinor,
      payoutId: input.payoutId,
      returnedAmountMinor: input.returnedAmountMinor,
      status: 'returned',
      walletId: input.walletId,
    };
  }

  if (!['failed', 'paid', 'processing', 'submitted'].includes(input.status)) {
    throw new BadRequestException('payout report lines must carry a supported payout status');
  }

  return {
    currency: input.currency,
    customerExternalRef: input.customerExternalRef,
    eventTimestamp: input.eventTimestamp,
    externalPayoutId: input.externalPayoutId,
    externalRequestId: input.externalRequestId,
    feeAmountMinor: input.feeAmountMinor,
    grossAmountMinor: input.grossAmountMinor,
    internalReference: input.internalReference ?? null,
    lineId: input.lineId,
    lineType: 'payout',
    netAmountMinor: input.netAmountMinor,
    payoutId: input.payoutId,
    recipientName: input.recipientName ?? null,
    status: input.status as 'failed' | 'paid' | 'processing' | 'submitted',
    walletId: input.walletId,
  };
}
