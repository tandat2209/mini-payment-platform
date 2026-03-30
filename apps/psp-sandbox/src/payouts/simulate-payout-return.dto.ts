import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class SimulatePayoutReturnRequestDto {
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
  returnReason?: string;

  @IsInt()
  @IsPositive()
  returnedAmountMinor!: number;
}

function normalizeTrimmedString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}
