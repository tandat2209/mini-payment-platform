import { IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

const POSTGRES_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export class CreatePayoutDto {
  @IsInt()
  @Min(1)
  amountMinor!: number;

  @Matches(POSTGRES_UUID_PATTERN)
  recipientRailId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  reference?: string;

  @IsString()
  @Matches(/^[A-Z]{3}$/u)
  sourceCurrency!: string;

  @Matches(POSTGRES_UUID_PATTERN)
  sourceWalletId!: string;
}
