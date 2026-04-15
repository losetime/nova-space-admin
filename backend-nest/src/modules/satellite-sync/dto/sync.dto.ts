import {
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";

export type SyncType =
  | "celestrak"
  | "space-track"
  | "space-track-meta"
  | "keeptrack-tle"
  | "keeptrack-meta"
  | "discos";
export type SyncStatus = "pending" | "running" | "completed" | "failed";

export class SyncRequestDto {
  @IsEnum([
    "celestrak",
    "space-track",
    "space-track-meta",
    "keeptrack-tle",
    "keeptrack-meta",
    "discos",
  ])
  type: SyncType;

  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @IsOptional()
  @IsEnum([
    "celestrak",
    "space-track",
    "space-track-meta",
    "keeptrack-tle",
    "keeptrack-meta",
    "discos",
  ])
  sourceType?: SyncType;
}

export interface SyncProgress {
  total: number;
  processed: number;
  success: number;
  failed: number;
  percentage: number;
  estimatedTimeRemaining?: string;
}

export interface SyncErrorLogEntry {
  noradId: string;
  name?: string;
  errorType: string;
  errorMessage: string;
  timestamp: string;
}

export interface SyncStatusResponse {
  taskId: string;
  type: SyncType;
  status: SyncStatus;
  startedAt: string;
  completedAt?: string;
  progress: SyncProgress;
  error?: string;
  recentErrors?: SyncErrorLogEntry[];
}

export interface SyncStatsResponse {
  tleCount: number;
  metadataCount: number;
  discosCount: number;
  keepTrackMetadataCount: number;
  spaceTrackMetadataCount: number;
  discosCoverage: string;
  keepTrackCoverage: string;
  spaceTrackCoverage: string;
  celestrakCount?: number;
  keepTrackCount?: number;
  spaceTrackTleCount?: number;
  lastTleSync?: string;
  lastDiscosSync?: string;
  lastCelestrakSync?: string;
  lastKeepTrackSync?: string;
  lastSpaceTrackSync?: string;
}

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
  @IsEnum(["pending", "running", "completed", "failed"])
  status?: SyncStatus;

  @IsOptional()
  @IsEnum([
    "celestrak",
    "space-track",
    "space-track-meta",
    "keeptrack-tle",
    "keeptrack-meta",
    "discos",
  ])
  type?: SyncType;
}

export interface TaskListResponse {
  data: SyncTaskItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
  search?: string;

  @IsOptional()
  @IsEnum(["celestrak", "space-track", "keeptrack"])
  source?: string;
}

export interface TleListResponse {
  data: TleItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
  search?: string;
}

export interface MetadataListResponse {
  data: MetadataItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

export interface ErrorLogListResponse {
  data: ErrorLogItem[];
  total: number;
}

export interface ErrorLogItem {
  id: string;
  noradId: string;
  name?: string;
  source: string;
  errorType: string;
  errorMessage: string;
  timestamp: string;
}

export class StopSyncDto {}
