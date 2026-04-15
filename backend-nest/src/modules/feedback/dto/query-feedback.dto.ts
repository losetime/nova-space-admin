import { IsEnum, IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export const feedbackTypes = ["bug", "feature", "suggestion", "other"] as const;
export const feedbackStatuses = [
  "pending",
  "processing",
  "resolved",
  "closed",
] as const;
export type FeedbackType = (typeof feedbackTypes)[number];
export type FeedbackStatus = (typeof feedbackStatuses)[number];

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

  @IsEnum(feedbackTypes)
  @IsOptional()
  type?: FeedbackType;

  @IsEnum(feedbackStatuses)
  @IsOptional()
  status?: FeedbackStatus;
}
