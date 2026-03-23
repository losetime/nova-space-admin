import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePushRecordDto {
  @IsString()
  contentType: string;

  @IsInt()
  @Type(() => Number)
  contentId: number;

  @IsString()
  title: string;

  @IsEnum(['all', 'basic', 'advanced', 'professional'])
  @IsOptional()
  targetLevel?: string;
}

export class UpdatePushRecordDto {
  @IsEnum(['pending', 'sending', 'success', 'failed'])
  @IsOptional()
  status?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  successCount?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  failCount?: number;

  @IsString()
  @IsOptional()
  errorMessage?: string;
}

export class QueryPushRecordDto {
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
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsEnum(['pending', 'sending', 'success', 'failed'])
  status?: string;
}