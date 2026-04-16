import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type SubscriptionPlan = 'monthly' | 'quarterly' | 'yearly' | 'lifetime' | 'custom';

export class QuerySubscriptionDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEnum(['active', 'expired', 'cancelled', 'pending'])
  status?: SubscriptionStatus;

  @IsOptional()
  @IsEnum(['monthly', 'quarterly', 'yearly', 'lifetime', 'custom'])
  plan?: SubscriptionPlan;

  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @IsOptional()
  @IsDateString()
  endDateTo?: string;

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

export class AdminActivateDto {
  @IsEnum(['monthly', 'quarterly', 'yearly', 'lifetime', 'custom'])
  plan: SubscriptionPlan;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdminCancelDto {
  @IsOptional()
  @IsString()
  reason?: string;
}