import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLevelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateLevelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class LevelBenefitItemDto {
  @IsString()
  benefitId: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  displayText?: string;
}

export class ConfigureLevelBenefitsDto {
  @IsOptional()
  benefits?: LevelBenefitItemDto[];
}

export class AddLevelBenefitDto {
  @IsString()
  benefitId: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  displayText?: string;
}

export class QueryLevelDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}