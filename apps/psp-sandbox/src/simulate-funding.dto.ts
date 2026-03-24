import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

import { type FundingSimulationRequest } from './app.service';

class SimulateFundingSenderDto {
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

export class SimulateFundingRequestDto {
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
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  externalEventId?: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  @IsIn(['account_number', 'iban', 'virtual_account'])
  destinationType!: FundingSimulationRequest['destinationType'];

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  providerReference?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SimulateFundingSenderDto)
  sender?: {
    accountIdentifier?: string;
    bankCode?: string;
    bankName?: string;
    name: string;
  };
}

function normalizeTrimmedString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeTrimmedUppercaseString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}
