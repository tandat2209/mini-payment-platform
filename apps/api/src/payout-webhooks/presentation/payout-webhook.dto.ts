import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

import { type PayoutWebhook } from '../../payouts/domain/payout-webhook.types';

class PayoutWebhookDataDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  currency?: string;

  @IsString()
  @IsNotEmpty()
  externalPayoutId!: string;

  @IsString()
  @IsNotEmpty()
  externalRequestId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  failureReason?: string;

  @IsString()
  @IsNotEmpty()
  payoutReference!: string;

  @IsString()
  @IsIn(['processing', 'paid', 'failed', 'returned'])
  status!: 'failed' | 'paid' | 'processing' | 'returned';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  returnReason?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  returnedAmountMinor?: number;
}

export class PayoutWebhookRequestDto {
  @ValidateNested()
  @Type(() => PayoutWebhookDataDto)
  data!: PayoutWebhookDataDto;

  @IsString()
  @IsIn(['payout.updated', 'payout.returned'])
  eventType!: 'payout.updated' | 'payout.returned';

  @IsString()
  @IsNotEmpty()
  externalEventId!: string;

  @IsISO8601()
  occurredAt!: string;

  @IsString()
  @IsNotEmpty()
  provider!: string;

  toDomain(): PayoutWebhook {
    validateWebhookShape(this);

    if (this.eventType === 'payout.returned') {
      return {
        data: {
          currency: this.data.currency as string,
          externalPayoutId: this.data.externalPayoutId,
          externalRequestId: this.data.externalRequestId,
          payoutReference: this.data.payoutReference,
          ...(this.data.returnReason === undefined ? {} : { returnReason: this.data.returnReason }),
          returnedAmountMinor: this.data.returnedAmountMinor as number,
          status: 'returned',
        },
        eventType: 'payout.returned',
        externalEventId: this.externalEventId,
        occurredAt: this.occurredAt,
        provider: this.provider,
      };
    }

    return {
      data: {
        externalPayoutId: this.data.externalPayoutId,
        externalRequestId: this.data.externalRequestId,
        ...(this.data.failureReason === undefined
          ? {}
          : { failureReason: this.data.failureReason }),
        payoutReference: this.data.payoutReference,
        status: this.data.status as 'failed' | 'paid' | 'processing',
      },
      eventType: 'payout.updated',
      externalEventId: this.externalEventId,
      occurredAt: this.occurredAt,
      provider: this.provider,
    };
  }
}

function validateWebhookShape(input: PayoutWebhookRequestDto): void {
  if (input.eventType === 'payout.updated') {
    if (input.data.status === 'returned') {
      throw new BadRequestException('payout.updated cannot carry returned status');
    }

    if (input.data.returnedAmountMinor !== undefined || input.data.currency !== undefined) {
      throw new BadRequestException(
        'payout.updated cannot carry returned payout amount or currency fields',
      );
    }

    if (input.data.status !== 'failed' && input.data.failureReason !== undefined) {
      throw new BadRequestException(
        'Failure reason can only be provided for failed payout updates',
      );
    }

    return;
  }

  if (input.data.status !== 'returned') {
    throw new BadRequestException('payout.returned must carry returned status');
  }

  if (input.data.returnedAmountMinor === undefined) {
    throw new BadRequestException('payout.returned requires returnedAmountMinor');
  }

  if (input.data.currency === undefined) {
    throw new BadRequestException('payout.returned requires currency');
  }

  if (input.data.failureReason !== undefined) {
    throw new BadRequestException('payout.returned cannot carry failureReason');
  }
}
