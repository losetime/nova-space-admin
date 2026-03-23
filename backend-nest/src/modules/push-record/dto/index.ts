import { IsEnum, IsInt, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PushTriggerType, PushRecordStatus } from '../../../common/enums/push.enum';

export class CreatePushRecordDto {
  @IsString()
  userId: string;

  @IsEnum(PushTriggerType)
  @IsOptional()
  triggerType?: PushTriggerType;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsDateString()
  sentAt: string;
}

export class UpdatePushRecordDto {
  @IsEnum(PushRecordStatus)
  @IsOptional()
  status?: PushRecordStatus;

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
  @IsEnum(PushTriggerType)
  triggerType?: PushTriggerType;

  @IsOptional()
  @IsEnum(PushRecordStatus)
  status?: PushRecordStatus;

  @IsOptional()
  @IsString()
  userId?: string;
}