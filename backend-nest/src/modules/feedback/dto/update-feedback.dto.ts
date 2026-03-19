import { IsEnum, IsOptional } from 'class-validator';
import { FeedbackStatus } from '../entities/feedback.entity';

export class UpdateFeedbackDto {
  @IsEnum(FeedbackStatus, { message: '状态值不正确' })
  @IsOptional()
  status?: FeedbackStatus;
}