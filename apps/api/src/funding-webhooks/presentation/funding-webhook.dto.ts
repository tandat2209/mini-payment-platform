import { Transform, Type } from 'class-transformer';
import {
  Equals,
  IsDefined,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

import { type FundingWebhook } from '../../funding/domain/funding.types';

export class FundingWebhookDataDto {
  @IsInt()
  @Min(1)
  amountMinor!: number;

  @Transform(({ value }) => normalizeTrimmedUppercaseString(value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}$/)
  currency!: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  customerExternalRef!: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  fundingDetailId!: string;
}

export class FundingWebhookRequestDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => FundingWebhookDataDto)
  data!: FundingWebhookDataDto;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @Equals('funding.completed')
  eventType!: 'funding.completed';

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  externalEventId!: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @IsISO8601()
  occurredAt!: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  provider!: string;

  toDomain(): FundingWebhook {
    return {
      data: {
        amountMinor: this.data.amountMinor,
        currency: this.data.currency,
        customerExternalRef: this.data.customerExternalRef,
        fundingDetailId: this.data.fundingDetailId,
      },
      eventType: this.eventType,
      externalEventId: this.externalEventId,
      occurredAt: this.occurredAt,
      provider: this.provider,
    };
  }
}

function normalizeTrimmedString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeTrimmedUppercaseString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}
