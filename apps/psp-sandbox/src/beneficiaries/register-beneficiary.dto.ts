import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsObject, IsString, Length } from 'class-validator';

export class RegisterBeneficiaryRequestDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  recipientName!: string;

  @IsString()
  @IsIn(['sepa', 'swift'])
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  rail!: 'sepa' | 'swift';

  @IsString()
  @Length(2, 2)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  countryCode!: string;

  @IsString()
  @Length(3, 3)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  currency!: string;

  @IsObject()
  details!: Record<string, unknown>;
}
