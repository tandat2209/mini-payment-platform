import { Type } from 'class-transformer';
import { IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { type PayoutWebhook } from '../../payouts/domain/payout-webhook.types';

class PayoutWebhookDataDto {
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
  @IsIn(['processing', 'paid', 'failed'])
  status!: 'failed' | 'paid' | 'processing';
}

export class PayoutWebhookRequestDto {
  @ValidateNested()
  @Type(() => PayoutWebhookDataDto)
  data!: PayoutWebhookDataDto;

  @IsString()
  @IsIn(['payout.updated'])
  eventType!: 'payout.updated';

  @IsString()
  @IsNotEmpty()
  externalEventId!: string;

  @IsISO8601()
  occurredAt!: string;

  @IsString()
  @IsNotEmpty()
  provider!: string;

  toDomain(): PayoutWebhook {
    return {
      data: {
        externalPayoutId: this.data.externalPayoutId,
        externalRequestId: this.data.externalRequestId,
        ...(this.data.failureReason === undefined
          ? {}
          : { failureReason: this.data.failureReason }),
        payoutReference: this.data.payoutReference,
        status: this.data.status,
      },
      eventType: this.eventType,
      externalEventId: this.externalEventId,
      occurredAt: this.occurredAt,
      provider: this.provider,
    };
  }
}
