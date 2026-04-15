import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsBoolean,
} from "class-validator";
import { Transform } from "class-transformer";

export const milestoneCategories = [
  "launch",
  "recovery",
  "orbit",
  "mission",
  "other",
] as const;
export type MilestoneCategory = (typeof milestoneCategories)[number];
export interface MediaItem {
  type: "image" | "video";
  url: string;
  caption?: string;
}

export class CreateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsDateString()
  @IsNotEmpty()
  eventDate: string;

  @IsEnum(milestoneCategories)
  @IsOptional()
  category?: MilestoneCategory;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsOptional()
  media?: MediaItem[];

  @IsString()
  @IsOptional()
  relatedSatelliteNoradId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  importance?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  organizer?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true" || value === 1)
  isPublished?: boolean;
}

export class UpdateMilestoneDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsDateString()
  @IsOptional()
  eventDate?: string;

  @IsEnum(milestoneCategories)
  @IsOptional()
  category?: MilestoneCategory;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsOptional()
  media?: MediaItem[];

  @IsString()
  @IsOptional()
  relatedSatelliteNoradId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  importance?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  organizer?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true" || value === 1)
  isPublished?: boolean;
}

export class QueryMilestoneDto {
  @IsOptional()
  @IsEnum(milestoneCategories)
  category?: MilestoneCategory;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    const num = parseInt(String(value));
    return isNaN(num) ? undefined : num;
  })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    const num = parseInt(String(value));
    return isNaN(num) ? undefined : num;
  })
  pageSize?: number = 12;

  @IsOptional()
  sortBy?: "eventDate" | "importance" | "createdAt" = "eventDate";

  @IsOptional()
  sortOrder?: "ASC" | "DESC" = "DESC";

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    const num = parseInt(String(value));
    return isNaN(num) ? undefined : num;
  })
  importance?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return undefined;
  })
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
