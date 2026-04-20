import {
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export type PlanLevel = "basic" | "advanced" | "professional";
export type PlanCode =
  | "monthly"
  | "quarterly"
  | "yearly"
  | "lifetime"
  | "custom";

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsEnum(["monthly", "quarterly", "yearly", "lifetime", "custom"])
  planCode: PlanCode;

  @IsInt()
  @Min(1)
  durationMonths: number;

  @IsString()
  level: string;

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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMonths?: number;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pointsPrice?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  features?: Record<string, any>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class QueryPlanDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  level?: string;

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
