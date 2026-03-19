import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FeedbackType, FeedbackStatus } from '../entities/feedback.entity';

export class QueryFeedbackDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @IsEnum(FeedbackType)
  @IsOptional()
  type?: FeedbackType;

  @IsEnum(FeedbackStatus)
  @IsOptional()
  status?: FeedbackStatus;
}