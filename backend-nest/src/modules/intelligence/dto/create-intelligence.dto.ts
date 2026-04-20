import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUrl,
  IsInt,
  Min,
  ValidateIf,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export enum IntelligenceCategory {
  LAUNCH = "launch",
  SATELLITE = "satellite",
  INDUSTRY = "industry",
  RESEARCH = "research",
  ENVIRONMENT = "environment",
}

export enum IntelligenceLevel {
  FREE = "free",
  BASIC = "basic",
  ADVANCED = "advanced",
  PROFESSIONAL = "professional",
}

export class CreateIntelligenceDto {
  @IsString()
  @IsNotEmpty({ message: "标题不能为空" })
  title: string;

  @IsString()
  @IsNotEmpty({ message: "内容不能为空" })
  content: string;

  @IsString()
  @IsNotEmpty({ message: "摘要不能为空" })
  summary: string;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsEnum(IntelligenceCategory, { message: "分类不正确" })
  @IsNotEmpty({ message: "分类不能为空" })
  category: IntelligenceCategory;

  @IsEnum(IntelligenceLevel, { message: "等级不正确" })
  @IsNotEmpty({ message: "等级不能为空" })
  level: IntelligenceLevel;

  @IsString()
  @IsNotEmpty({ message: "来源不能为空" })
  source: string;

  @ValidateIf((o) => o.sourceUrl && o.sourceUrl.length > 0)
  @IsUrl({}, { message: "来源链接必须是有效的URL地址" })
  sourceUrl?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.length > 0 ? value.join(",") : "";
    return value;
  })
  @IsString()
  tags?: string;

  @IsString()
  @IsOptional()
  analysis?: string;

  @IsString()
  @IsOptional()
  trend?: string;

  @IsOptional()
  publishedAt?: Date;
}

export class UpdateIntelligenceDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsEnum(IntelligenceCategory, { message: "分类不正确" })
  @IsOptional()
  category?: IntelligenceCategory;

  @IsEnum(IntelligenceLevel, { message: "等级不正确" })
  @IsOptional()
  level?: IntelligenceLevel;

  @IsString()
  @IsOptional()
  source?: string;

  @ValidateIf((o) => o.sourceUrl && o.sourceUrl.length > 0)
  @IsUrl({}, { message: "来源链接必须是有效的URL地址" })
  sourceUrl?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.length > 0 ? value.join(",") : "";
    return value;
  })
  @IsString()
  tags?: string;

  @IsString()
  @IsOptional()
  analysis?: string;

  @IsString()
  @IsOptional()
  trend?: string;

  @IsOptional()
  publishedAt?: Date;
}

export class QueryIntelligenceDto {
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

  @IsOptional()
  @IsEnum(IntelligenceCategory)
  category?: IntelligenceCategory;

  @IsOptional()
  @IsEnum(IntelligenceLevel)
  level?: IntelligenceLevel;

  @IsOptional()
  @IsString()
  keyword?: string;
}
