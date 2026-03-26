import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SatelliteSyncService } from './satellite-sync.service';
import { SyncRequestDto, SyncStatusResponse, SyncStatsResponse } from './dto/sync.dto';

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
    this.logger.log(`收到同步请求: type=${dto.type}, force=${dto.force}`);

    try {
      const task = await this.syncService.startSync(dto.type);

      return {
        success: true,
        data: {
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
        },
        message: '同步任务已启动',
      };
    } catch (error) {
      this.logger.error(`同步启动失败: ${error.message}`);
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  /**
   * 获取同步状态
   * GET /api/satellite-sync/status
   */
  @Get('status')
  async getSyncStatus() {
    const task = await this.syncService.getCurrentStatus();

    if (!task) {
      return {
        success: true,
        data: null,
        message: '当前没有运行中的同步任务',
      };
    }

    return {
      success: true,
      data: {
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
      },
      message: 'success',
    };
  }

  /**
   * 获取数据统计
   * GET /api/satellite-sync/stats
   */
  @Get('stats')
  async getStats() {
    const stats = await this.syncService.getStats();

    return {
      success: true,
      data: stats,
      message: 'success',
    };
  }
}