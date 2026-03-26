import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

import { type PayoutSubmissionRequest } from './payouts.types';

class PayoutRecipientDto {
  @Transform(({ value }) => normalizeTrimmedUppercaseString(value))
  @IsString()
  @Matches(/^[A-Z]{2}$/u)
  countryCode!: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @IsIn(['ach', 'sepa', 'swift'])
  rail!: PayoutSubmissionRequest['recipient']['rail'];
}

class PayoutSimulationDto {
  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsOptional()
  @IsString()
  @IsIn(['manual'])
  callbackMode?: 'manual';

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsOptional()
  @IsString()
  @IsIn(['paid', 'failed'])
  finalStatus?: 'failed' | 'paid';
}

export class SubmitPayoutRequestDto {
  @IsInt()
  @Min(1)
  amountMinor!: number;

  @Transform(({ value }) => normalizeTrimmedUppercaseString(value))
  @IsString()
  @Matches(/^[A-Z]{3}$/u)
  currency!: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  payoutReference!: string;

  @ValidateNested()
  @Type(() => PayoutRecipientDto)
  recipient!: PayoutRecipientDto;

  @IsObject()
  submissionTarget!: PayoutSubmissionRequest['submissionTarget'];

  @IsOptional()
  @ValidateNested()
  @Type(() => PayoutSimulationDto)
  simulation?: PayoutSimulationDto;
}

function normalizeTrimmedString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeTrimmedUppercaseString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}
