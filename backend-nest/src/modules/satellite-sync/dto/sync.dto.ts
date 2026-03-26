import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { SyncType } from '../entities/sync-task.entity';

/**
 * 同步请求 DTO
 */
export class SyncRequestDto {
  @IsEnum(['tle', 'discos', 'all'])
  type: SyncType;

  @IsOptional()
  @IsBoolean()
  force?: boolean; // 是否强制同步（忽略缓存）
}

/**
 * 同步进度
 */
export interface SyncProgress {
  total: number;
  processed: number;
  success: number;
  failed: number;
  percentage: number;
  estimatedTimeRemaining?: string; // 预计剩余时间
}

/**
 * 同步状态响应
 */
export interface SyncStatusResponse {
  taskId: string;
  type: SyncType;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  progress: SyncProgress;
  error?: string;
}

/**
 * 数据统计响应
 */
export interface SyncStatsResponse {
  tleCount: number;
  metadataCount: number;
  discosCount: number;
  discosCoverage: string; // DISCOS 数据覆盖率百分比
  lastTleSync?: string;
  lastDiscosSync?: string;
}