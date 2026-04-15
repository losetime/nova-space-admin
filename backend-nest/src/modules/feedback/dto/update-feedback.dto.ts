import { IsEnum, IsOptional } from "class-validator";
import { feedbackStatuses } from "./query-feedback.dto";
import type { FeedbackStatus } from "./query-feedback.dto";

export class UpdateFeedbackDto {
  @IsEnum(feedbackStatuses, { message: "状态值不正确" })
  @IsOptional()
  status?: FeedbackStatus;
}
