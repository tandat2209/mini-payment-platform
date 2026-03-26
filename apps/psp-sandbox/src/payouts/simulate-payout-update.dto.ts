import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { type PayoutUpdateSimulationRequest } from './payouts.types';

export class SimulatePayoutUpdateRequestDto {
  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  externalEventId?: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  externalPayoutId!: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  failureReason?: string;

  @Transform(({ value }) => normalizeTrimmedString(value))
  @IsString()
  @IsIn(['processing', 'paid', 'failed'])
  status!: PayoutUpdateSimulationRequest['status'];
}

function normalizeTrimmedString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}
