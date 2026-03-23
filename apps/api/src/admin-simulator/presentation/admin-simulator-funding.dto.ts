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

import { type AdminSimulatorFundingRequest } from '../domain/admin-simulator.types';

class AdminSimulatorFundingSenderDto {
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

export class AdminSimulatorFundingRequestDto {
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
  @IsString()
  @IsNotEmpty()
  @IsIn(['account_number', 'iban', 'virtual_account'])
  destinationType!: AdminSimulatorFundingRequest['destinationType'];

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
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  providerReference?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminSimulatorFundingSenderDto)
  sender?: AdminSimulatorFundingSenderDto;

  toDomain(): AdminSimulatorFundingRequest {
    const result: AdminSimulatorFundingRequest = {
      amountMinor: this.amountMinor,
      currency: this.currency,
      destinationIdentifier: this.destinationIdentifier,
      destinationType: this.destinationType,
    };

    if (this.description !== undefined) {
      result.description = this.description;
    }

    if (this.externalEventId !== undefined) {
      result.externalEventId = this.externalEventId;
    }

    if (this.providerReference !== undefined) {
      result.providerReference = this.providerReference;
    }

    if (this.sender !== undefined) {
      result.sender = {
        name: this.sender.name,
      };

      if (this.sender.accountIdentifier !== undefined) {
        result.sender.accountIdentifier = this.sender.accountIdentifier;
      }

      if (this.sender.bankCode !== undefined) {
        result.sender.bankCode = this.sender.bankCode;
      }

      if (this.sender.bankName !== undefined) {
        result.sender.bankName = this.sender.bankName;
      }
    }

    return result;
  }
}

function normalizeTrimmedString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeTrimmedUppercaseString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}
