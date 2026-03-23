import { Transform, Type } from 'class-transformer';
import {
  Equals,
  IsDefined,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  type FundingDestinationType,
  type FundingWebhook,
} from '../../funding/domain/funding.types';

export class FundingWebhookSenderDto {
  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accountIdentifier?: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bankName?: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bankCode?: string;
}

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
  destinationIdentifier!: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  @IsIn(['account_number', 'iban', 'virtual_account'])
  destinationType!: FundingDestinationType;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  providerReference?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FundingWebhookSenderDto)
  sender?: FundingWebhookSenderDto;
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
      data: toFundingWebhookData(this.data),
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

function toFundingWebhookData(data: FundingWebhookDataDto): FundingWebhook['data'] {
  const result: FundingWebhook['data'] = {
    amountMinor: data.amountMinor,
    currency: data.currency,
    destinationIdentifier: data.destinationIdentifier,
    destinationType: data.destinationType,
  };

  if (data.description !== undefined) {
    result.description = data.description;
  }

  if (data.providerReference !== undefined) {
    result.providerReference = data.providerReference;
  }

  if (data.sender !== undefined) {
    result.sender = {
      name: data.sender.name,
    };

    if (data.sender.accountIdentifier !== undefined) {
      result.sender.accountIdentifier = data.sender.accountIdentifier;
    }

    if (data.sender.bankCode !== undefined) {
      result.sender.bankCode = data.sender.bankCode;
    }

    if (data.sender.bankName !== undefined) {
      result.sender.bankName = data.sender.bankName;
    }
  }

  return result;
}
