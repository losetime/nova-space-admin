import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class SyncDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  count?: number = 10;
}

export class SyncConfigDto {
  @IsOptional()
  enabled?: boolean;

  @IsOptional()
  cron?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  count?: number;
}