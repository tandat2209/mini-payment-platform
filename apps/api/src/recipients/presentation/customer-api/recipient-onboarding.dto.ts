import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

export class RecipientRequirementsQueryDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsIn(['ach', 'sepa', 'swift'])
  rail!: string;

  @IsString()
  @Length(2, 2)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  countryCode!: string;

  @IsString()
  @Length(3, 3)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  currency!: string;
}

export class RecipientCapabilitiesQueryDto {
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim().toUpperCase() : undefined,
  )
  countryCode?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim().toLowerCase() : undefined,
  )
  @IsIn(['ach', 'sepa', 'swift'])
  rail?: string;
}

export class CreateRecipientRailDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsIn(['ach', 'sepa', 'swift'])
  rail!: string;

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

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateRecipientDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @ValidateNested()
  @Type(() => CreateRecipientRailDto)
  rail!: CreateRecipientRailDto;
}
