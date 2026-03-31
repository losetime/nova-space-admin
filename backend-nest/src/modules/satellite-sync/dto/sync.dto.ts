import { IsEnum, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SyncType, SyncStatus } from '../entities/sync-task.entity';

/**
 * 同步请求 DTO
 */
export class SyncRequestDto {
  @IsEnum(['celestrak', 'space-track', 'space-track-meta', 'keeptrack-tle', 'keeptrack-meta', 'discos', 'all'])
  type: SyncType;

  @IsOptional()
  @IsBoolean()
  force?: boolean; // 是否强制同步（忽略缓存）

  @IsOptional()
  @IsEnum(['celestrak', 'space-track', 'space-track-meta', 'keeptrack-tle', 'keeptrack-meta', 'discos', 'all'])
  sourceType?: SyncType; // 用于指定数据源类型
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
 * 错误日志摘要（用于实时显示）
 */
export interface SyncErrorLogEntry {
  noradId: string;
  name?: string;
  errorType: string;
  errorMessage: string;
  timestamp: string;
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
  recentErrors?: SyncErrorLogEntry[]; // 最近 N 条错误日志
}

/**
 * 数据统计响应
 */
export interface SyncStatsResponse {
  tleCount: number;
  metadataCount: number;
  discosCount: number;
  keepTrackMetadataCount: number; // KeepTrack 元数据数量
  spaceTrackMetadataCount: number; // Space-Track 元数据数量
  discosCoverage: string; // DISCOS 数据覆盖率百分比
  keepTrackCoverage: string; // KeepTrack 数据覆盖率百分比
  spaceTrackCoverage: string; // Space-Track 数据覆盖率百分比
  celestrakCount?: number;
  keepTrackCount?: number;
  spaceTrackTleCount?: number; // Space-Track TLE 数量
  lastTleSync?: string;
  lastDiscosSync?: string;
  lastCelestrakSync?: string;
  lastKeepTrackSync?: string;
  lastSpaceTrackSync?: string;
}

/**
 * 任务列表查询 DTO
 */
export class TaskListQueryDto {
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
  @IsEnum(['pending', 'running', 'completed', 'failed'])
  status?: SyncStatus;

  @IsOptional()
  @IsEnum(['celestrak', 'space-track', 'space-track-meta', 'keeptrack-tle', 'keeptrack-meta', 'discos', 'all'])
  type?: SyncType;
}

/**
 * 任务列表响应
 */
export interface TaskListResponse {
  data: SyncTaskItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 任务项
 */
export interface SyncTaskItem {
  id: string;
  type: SyncType;
  status: SyncStatus;
  total: number;
  processed: number;
  success: number;
  failed: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

/**
 * TLE 数据查询 DTO
 */
export class TleListQueryDto {
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
  limit?: number = 20;

  @IsOptional()
  search?: string; // 搜索名称或 NORAD ID

  @IsOptional()
  @IsEnum(['celestrak', 'space-track', 'keeptrack'])
  source?: string;
}

/**
 * TLE 数据列表响应
 */
export interface TleListResponse {
  data: TleItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * TLE 数据项
 */
export interface TleItem {
  noradId: string;
  name: string;
  source: string;
  epoch?: string;
  inclination?: number;
  raan?: number;
  eccentricity?: number;
  line1?: string;
  line2?: string;
}

/**
 * 元数据查询 DTO
 */
export class MetadataListQueryDto {
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
  limit?: number = 20;

  @IsOptional()
  search?: string; // 搜索名称或 NORAD ID
}

/**
 * 元数据列表响应
 */
export interface MetadataListResponse {
  data: MetadataItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 元数据项
 */
export interface MetadataItem {
  noradId: string;
  name: string;
  countryCode?: string;
  launchDate?: string;
  objectType?: string;
  status?: string;
  hasKeepTrackData?: boolean;
  hasSpaceTrackData?: boolean;
  hasDiscosData?: boolean;
}

/**
 * 错误日志列表响应
 */
export interface ErrorLogListResponse {
  data: ErrorLogItem[];
  total: number;
}

/**
 * 错误日志项
 */
export interface ErrorLogItem {
  id: string;
  noradId: string;
  name?: string;
  source: string;
  errorType: string;
  errorMessage: string;
  timestamp: string;
}

/**
 * 停止同步请求 DTO
 */
export class StopSyncDto {}