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
} from "@nestjs/common";
import { SatelliteSyncService } from "./satellite-sync.service";
import {
  SyncRequestDto,
  TaskListQueryDto,
  TleListQueryDto,
  MetadataListQueryDto,
} from "./dto/sync.dto";

@Controller("satellite-sync")
export class SatelliteSyncController {
  private readonly logger = new Logger(SatelliteSyncController.name);

  constructor(private readonly syncService: SatelliteSyncService) {}

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
        percentage:
          task.total > 0 ? Math.round((task.processed / task.total) * 100) : 0,
      },
    };
  }

  @Get("status")
  async getSyncStatus() {
    const task = await this.syncService.getCurrentStatus();

    if (!task) {
      return null;
    }

    let recentErrors: Array<{
      noradId: string;
      name: string;
      errorType: string;
      errorMessage: string;
      timestamp: string;
    }> = [];
    if (task.status === "running") {
      const errors = await this.syncService.getRecentErrors(task.id, 5);
      recentErrors = errors.map((err) => ({
        noradId: err.norad_id,
        name: err.name ?? "",
        errorType: err.error_type,
        errorMessage: err.error_message,
        timestamp: err.timestamp.toISOString(),
      }));
    }

    return {
      taskId: task.id,
      type: task.type,
      status: task.status,
      startedAt: task.started_at?.toISOString(),
      completedAt: task.completed_at?.toISOString(),
      progress: {
        total: task.total,
        processed: task.processed,
        success: task.success,
        failed: task.failed,
        percentage:
          task.total > 0 ? Math.round((task.processed / task.total) * 100) : 0,
      },
      error: task.error,
      recentErrors,
    };
  }

  @Post("stop")
  @HttpCode(HttpStatus.OK)
  async stopSync() {
    const task = await this.syncService.stopCurrentTask();
    return {
      taskId: task?.id,
      status: task?.status,
    };
  }

  @Get("stats")
  async getStats() {
    return this.syncService.getStats();
  }

  @Get("tasks")
  async getTaskList(@Query() query: TaskListQueryDto) {
    return this.syncService.getTaskList(query);
  }

  @Get("tasks/:id")
  async getTaskById(@Param("id") taskId: string) {
    const task = await this.syncService.getTaskById(taskId);
    if (!task) {
      return null;
    }
    return task;
  }

  @Get("tasks/:id/errors")
  async getTaskErrors(@Param("id") taskId: string) {
    return this.syncService.getTaskErrors(taskId);
  }

  @Get("tle")
  async getTleList(@Query() query: TleListQueryDto) {
    return this.syncService.getTleList(query);
  }

  @Get("metadata")
  async getMetadataList(@Query() query: MetadataListQueryDto) {
    return this.syncService.getMetadataList(query);
  }

  @Get("cron/status")
  getCronStatus() {
    return {
      enabled: this.syncService.isCronEnabled(),
    };
  }

  @Post("cron/toggle")
  @HttpCode(HttpStatus.OK)
  toggleCron(@Body() body: { enabled: boolean }) {
    this.syncService.setCronEnabled(body.enabled);
    return {
      enabled: this.syncService.isCronEnabled(),
      message: `定时任务已${body.enabled ? "启用" : "禁用"}`,
    };
  }
}
