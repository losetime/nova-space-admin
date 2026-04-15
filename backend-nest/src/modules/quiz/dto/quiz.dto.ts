import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";

export class QueryQuizDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreateQuizDto {
  @IsString()
  question: string;

  @IsArray()
  options: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  correctIndex: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsEnum(["basic", "advanced", "mission", "people"])
  category?: string = "basic";

  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number = 10;
}

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsOptional()
  @IsInt()
  correctIndex?: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsEnum(["basic", "advanced", "mission", "people"])
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;
}
