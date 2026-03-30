import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SatelliteSyncService } from './satellite-sync.service';
import {
  SyncRequestDto,
  SyncStatusResponse,
  SyncStatsResponse,
  TaskListQueryDto,
  TleListQueryDto,
  MetadataListQueryDto,
} from './dto/sync.dto';

/**
 * 卫星同步控制器
 * 提供卫星数据同步的 API 端点
 */
@Controller('satellite-sync')
export class SatelliteSyncController {
  private readonly logger = new Logger(SatelliteSyncController.name);

  constructor(private readonly syncService: SatelliteSyncService) {}

  /**
   * 触发同步
   * POST /api/satellite-sync
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async startSync(@Body() dto: SyncRequestDto) {
    this.logger.log(`收到同步请求：type=${dto.type}, force=${dto.force}`);

    const task = await this.syncService.startSync(dto.type);

    return {
      taskId: task.id,
      type: task.type,
      status: task.status,
      progress: {
        total: task.total,
        processed: task.processed,
        success: task.success,
        failed: task.failed,
        percentage: task.total > 0 ? Math.round((task.processed / task.total) * 100) : 0,
      },
    };
  }

  /**
   * 获取同步状态
   * GET /api/satellite-sync/status
   */
  @Get('status')
  async getSyncStatus() {
    const task = await this.syncService.getCurrentStatus();

    if (!task) {
      return null;
    }

    return {
      taskId: task.id,
      type: task.type,
      status: task.status,
      startedAt: task.startedAt.toISOString(),
      completedAt: task.completedAt?.toISOString(),
      progress: {
        total: task.total,
        processed: task.processed,
        success: task.success,
        failed: task.failed,
        percentage: task.total > 0 ? Math.round((task.processed / task.total) * 100) : 0,
      },
      error: task.error,
    };
  }

  /**
   * 获取数据统计
   * GET /api/satellite-sync/stats
   */
  @Get('stats')
  async getStats() {
    return this.syncService.getStats();
  }

  /**
   * 获取同步任务列表
   * GET /api/satellite-sync/tasks
   */
  @Get('tasks')
  async getTaskList(@Query() query: TaskListQueryDto) {
    return this.syncService.getTaskList(query);
  }

  /**
   * 获取任务详情
   * GET /api/satellite-sync/tasks/:id
   */
  @Get('tasks/:id')
  async getTaskById(@Param('id') taskId: string) {
    const task = await this.syncService.getTaskById(taskId);
    if (!task) {
      return null;
    }
    return task;
  }

  /**
   * 获取任务错误日志
   * GET /api/satellite-sync/tasks/:id/errors
   */
  @Get('tasks/:id/errors')
  async getTaskErrors(@Param('id') taskId: string) {
    return this.syncService.getTaskErrors(taskId);
  }

  /**
   * 获取 TLE 数据列表
   * GET /api/satellite-sync/tle
   */
  @Get('tle')
  async getTleList(@Query() query: TleListQueryDto) {
    return this.syncService.getTleList(query);
  }

  /**
   * 获取卫星元数据列表
   * GET /api/satellite-sync/metadata
   */
  @Get('metadata')
  async getMetadataList(@Query() query: MetadataListQueryDto) {
    return this.syncService.getMetadataList(query);
  }
}
