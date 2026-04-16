import {
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export type PlanLevel = 'basic' | 'advanced' | 'professional';
export type PlanCode = 'monthly' | 'quarterly' | 'yearly' | 'lifetime' | 'custom';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsEnum(['monthly', 'quarterly', 'yearly', 'lifetime', 'custom'])
  planCode: PlanCode;

  @IsInt()
  @Min(1)
  durationMonths: number;

  @IsEnum(['basic', 'advanced', 'professional'])
  level: PlanLevel;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pointsPrice?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  features?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMonths?: number;

  @IsOptional()
  @IsEnum(['basic', 'advanced', 'professional'])
  level?: PlanLevel;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pointsPrice?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  features?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class QueryPlanDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['basic', 'advanced', 'professional'])
  level?: PlanLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}