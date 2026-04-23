import { Injectable, Logger, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { join } from "path";
import {
  eq,
  and,
  or,
  like,
  desc,
  asc,
  sql,
  gte,
  inArray,
  SQL,
} from "drizzle-orm";
import type { Database } from "../../database";
import {
  satelliteSyncTasks,
  syncTypeEnum,
  syncStatusEnum,
} from "../../database/schema/satellite-sync-tasks";
import { satelliteTle } from "../../database/schema/satellite-tle";
import { satelliteMetadata } from "../../database/schema/satellite-metadata";
import {
  satelliteSyncErrorLogs,
  SyncErrorType,
} from "../../database/schema/satellite-sync-error-logs";
import {
  SyncStatsResponse,
  TaskListQueryDto,
  TaskListResponse,
  SyncTaskItem,
  TleListQueryDto,
  TleListResponse,
  TleItem,
  MetadataListQueryDto,
  MetadataListResponse,
  MetadataItem,
  ErrorLogListResponse,
  ErrorLogItem,
} from "./dto/sync.dto";

type SyncType = (typeof syncTypeEnum)[number];
type SyncStatus = (typeof syncStatusEnum)[number];

interface SpaceTrackGpResponse {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  NORAD_CAT_ID: string;
  EPOCH: string;
  TLE_LINE0: string;
  TLE_LINE1: string;
  TLE_LINE2: string;
  COUNTRY_CODE?: string;
  LAUNCH_DATE?: string;
  SITE?: string;
  OBJECT_TYPE?: string;
  RCS_SIZE?: string;
  DECAY_DATE?: string | null;
  INCLINATION?: string;
  ECCENTRICITY?: string;
  RA_OF_ASC_NODE?: string;
  ARG_OF_PERICENTER?: string;
  MEAN_MOTION?: string;
  APOAPSIS?: string;
  PERIAPSIS?: string;
  PERIOD?: string;
}

interface DiscosResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: {
      cosparId?: string;
      satno?: number;
      name?: string;
      objectClass?: string;
      mass?: number;
      shape?: string;
      width?: number;
      height?: number;
      depth?: number;
      span?: number;
      mission?: string;
      firstEpoch?: string;
      predDecayDate?: string;
    };
    relationships?: {
      operators?: { data?: Array<{ type: string; id: string }> };
      launch?: { data?: { type: string; id: string } | null };
    };
  }>;
  included?: Array<{
    type: string;
    id: string;
    attributes: {
      name?: string;
      flightNo?: string;
      cosparLaunchNo?: string;
      failure?: boolean;
    };
    relationships?: {
      vehicle?: { data?: { type: string; id: string } };
      site?: { data?: { type: string; id: string } };
    };
  }>;
}

interface CelestrakGpResponse {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  NORAD_CAT_ID: number;
}

interface KeepTrackBriefResponse {
  tle1: string;
  tle2: string;
  type: number;
  name: string;
  altName?: string;
  purpose?: string;
  vmag?: number;
  launchDate?: string;
  country?: string;
  rcs?: string;
  status?: string;
}

interface KeepTrackSatDetailResponse {
  NORAD_CAT_ID: string;
  NAME: string;
  OBJECT_ID?: string;
  ALT_NAME?: string;
  COUNTRY?: string;
  OWNER?: string;
  MANUFACTURER?: string;
  BUS?: string;
  CONFIGURATION?: string;
  MOTOR?: string;
  POWER?: string;
  LENGTH?: string;
  DIAMETER?: string;
  SPAN?: string;
  DRY_MASS?: string;
  LAUNCH_MASS?: string;
  LAUNCH_DATE?: string;
  STABLE_DATE?: string;
  LAUNCH_SITE?: string;
  LAUNCH_PAD?: string;
  LAUNCH_VEHICLE?: string;
  MISSION?: string;
  PURPOSE?: string;
  EQUIPMENT?: string;
  PAYLOAD?: string;
  ADCS?: string;
  RCS?: string;
  STATUS?: string;
  TYPE?: number;
  SHAPE?: string;
  LIFETIME?: string;
  VMAG?: number;
  CONSTELLATION_NAME?: string;
  COLOR?: string;
  MATERIAL_COMPOSITION?: string;
  MAJOR_EVENTS?: string;
  RELATED_SATELLITES?: string;
  TRANSMITTER_FREQUENCIES?: string;
  SOURCES?: string;
  reference_urls?: string;
  summary?: string;
  anomaly_flags?: string;
  last_reviewed?: string;
  TLE_LINE_1?: string;
  TLE_LINE_2?: string;
  EPOCH?: string;
  INCLINATION?: number;
  RA_OF_ASC_NODE?: number;
  MEAN_MOTION?: number;
  ARG_OF_PERICENTER?: number;
  MEAN_ANOMALY?: number;
  DECAY_DATE?: string;
}

type TaskRecord = typeof satelliteSyncTasks.$inferSelect;
type ErrorLogRecord = typeof satelliteSyncErrorLogs.$inferSelect;

@Injectable()
export class SatelliteSyncService {
  private readonly logger = new Logger(SatelliteSyncService.name);

  private readonly spaceTrackUsername: string;
  private readonly spaceTrackPassword: string;
  private readonly spaceTrackBaseUrl = "https://www.space-track.org";

  private readonly esaDiscosApiToken: string | undefined;
  private readonly esaDiscosBaseUrl = "https://discosweb.esoc.esa.int/api";

  private readonly celestrakBaseUrl = "https://celestrak.org/NORAD/elements";

  private readonly keepTrackApiKey: string;
  private readonly keepTrackBaseUrl = "https://api.keeptrack.space/v4";

  private currentTask: TaskRecord | null = null;
  private sessionCookie: string = "";
  private cookieExpiry: Date | null = null;
  private useMockData: boolean = false;
  private stopRequested: boolean = false;
  private cronEnabled: boolean = false;

  private readonly BATCH_INTERVAL_MS = 3000;
  private readonly RATE_LIMIT_WAIT_MS = 60000;
  private readonly DISCOS_MIN_INTERVAL_MS = 500;
  private readonly KEEPTRACK_MIN_DELAY_MS = 10000;
  private readonly KEEPTRACK_MAX_DELAY_MS = 40000;

  constructor(
    private readonly configService: ConfigService,
    @Inject("DATABASE") private db: Database,
  ) {
    this.spaceTrackUsername =
      this.configService.get<string>("app.spaceTrack.username") || "";
    this.spaceTrackPassword =
      this.configService.get<string>("app.spaceTrack.password") || "";
    this.esaDiscosApiToken = this.configService.get<string>(
      "app.esaDiscos.apiToken",
    );
    this.keepTrackApiKey =
      this.configService.get<string>("app.keepTrack.apiKey") || "";
    this.useMockData =
      this.configService.get<boolean>("app.useMockData") || false;
  }

  async getCurrentStatus(): Promise<TaskRecord | null> {
    // 优先从数据库查询正在运行的任务（获取最新进度）
    const runningTask = await this.db
      .select()
      .from(satelliteSyncTasks)
      .where(eq(satelliteSyncTasks.status, "running"))
      .orderBy(desc(satelliteSyncTasks.startedAt))
      .limit(1);

    if (runningTask[0]) {
      const task = runningTask[0];
      this.currentTask = task; // 同步更新内存缓存
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const taskAge = Date.now() - (task.startedAt?.getTime() || 0);
      this.logger.log(
        `找到 running 任务：${task.id}, 已运行：${Math.floor(taskAge / 1000)}秒，进度：${task.processed}/${task.total}`,
      );

      if (task.startedAt && task.startedAt < tenMinutesAgo) {
        this.logger.warn(`发现超时任务 ${task.id}，标记为失败`);
        await this.db
          .update(satelliteSyncTasks)
          .set({
            status: "failed",
            error: "任务超时（超过 10 分钟未完成）",
            completedAt: new Date(),
          })
          .where(eq(satelliteSyncTasks.id, task.id));
        this.currentTask = null;
        return null;
      }
      return task;
    }

    // 如果内存中有任务但数据库没有 running 状态，说明任务可能刚完成，查询最新状态
    if (this.currentTask) {
      const latestTask = await this.db
        .select()
        .from(satelliteSyncTasks)
        .where(eq(satelliteSyncTasks.id, this.currentTask.id))
        .limit(1);
      if (latestTask[0] && latestTask[0].status !== "running") {
        return latestTask[0];
      }
    }

    // 查找最近完成的任务（5分钟内）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentTask = await this.db
      .select()
      .from(satelliteSyncTasks)
      .where(
        and(
          inArray(satelliteSyncTasks.status, ["completed", "failed"]),
          gte(satelliteSyncTasks.completedAt, fiveMinutesAgo),
        ),
      )
      .orderBy(desc(satelliteSyncTasks.completedAt))
      .limit(1);

    if (recentTask[0]) {
      this.logger.debug(
        `返回最近完成的任务：${recentTask[0].id}, status: ${recentTask[0].status}`,
      );
    }

    return recentTask[0] || null;
  }

  async stopCurrentTask(): Promise<TaskRecord | null> {
    if (this.currentTask && this.currentTask.status === "running") {
      this.logger.log(`收到停止请求，任务 ID: ${this.currentTask.id}`);
      this.stopRequested = true;
      return this.currentTask;
    }

    const runningTask = await this.db
      .select()
      .from(satelliteSyncTasks)
      .where(eq(satelliteSyncTasks.status, "running"))
      .orderBy(desc(satelliteSyncTasks.startedAt))
      .limit(1);

    if (runningTask[0]) {
      this.logger.log(`收到停止请求，任务 ID: ${runningTask[0].id}`);
      this.stopRequested = true;
      return runningTask[0];
    }

    this.logger.warn("没有运行中的任务，无法停止");
    return null;
  }

  isCronEnabled(): boolean {
    return this.cronEnabled;
  }

  setCronEnabled(enabled: boolean): void {
    this.cronEnabled = enabled;
    this.logger.log(`定时任务已${enabled ? "启用" : "禁用"}`);
  }

  @Cron("0 * * * *")
  async handleKeepTrackMetaSyncCron() {
    if (!this.cronEnabled) {
      this.logger.debug("[定时任务] KeepTrack 元数据同步已禁用，跳过");
      return;
    }

    this.logger.log("[定时任务] 检查是否需要触发 KeepTrack 元数据同步...");

    const runningTask = await this.getCurrentStatus();
    if (runningTask && runningTask.status === "running") {
      this.logger.log(
        `[定时任务] 跳过本次同步，当前有任务正在运行: ${runningTask.id}`,
      );
      return;
    }

    if (!this.keepTrackApiKey) {
      this.logger.warn("[定时任务] KeepTrack API Key 未配置，跳过同步");
      return;
    }

    this.logger.log("[定时任务] 开始触发 KeepTrack 元数据同步");
    try {
      await this.startSync("keeptrack-meta");
    } catch (error: any) {
      this.logger.error(`[定时任务] 触发同步失败: ${error.message}`);
    }
  }

  async getStats(): Promise<SyncStatsResponse> {
    const tleCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(satelliteTle);
    const tleCount = Number(tleCountResult[0]?.count || 0);

    const metadataCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(satelliteMetadata);
    const metadataCount = Number(metadataCountResult[0]?.count || 0);

    const discosCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(satelliteMetadata)
      .where(eq(satelliteMetadata.hasDiscosData, true));
    const discosCount = Number(discosCountResult[0]?.count || 0);

    const keepTrackMetadataCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(satelliteMetadata)
      .where(eq(satelliteMetadata.hasKeepTrackData, true));
    const keepTrackMetadataCount = Number(
      keepTrackMetadataCountResult[0]?.count || 0,
    );

    const spaceTrackMetadataCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(satelliteMetadata)
      .where(eq(satelliteMetadata.hasSpaceTrackData, true));
    const spaceTrackMetadataCount = Number(
      spaceTrackMetadataCountResult[0]?.count || 0,
    );

    const celestrakCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(satelliteTle)
      .where(eq(satelliteTle.source, "celestrak"));
    const celestrakCount = Number(celestrakCountResult[0]?.count || 0);

    const keepTrackCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(satelliteTle)
      .where(eq(satelliteTle.source, "keeptrack"));
    const keepTrackCount = Number(keepTrackCountResult[0]?.count || 0);

    const spaceTrackTleCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(satelliteTle)
      .where(eq(satelliteTle.source, "space-track"));
    const spaceTrackTleCount = Number(spaceTrackTleCountResult[0]?.count || 0);

    const discosCoverage =
      metadataCount > 0
        ? ((discosCount / metadataCount) * 100).toFixed(1) + "%"
        : "0%";
    const keepTrackCoverage =
      metadataCount > 0
        ? ((keepTrackMetadataCount / metadataCount) * 100).toFixed(1) + "%"
        : "0%";
    const spaceTrackCoverage =
      metadataCount > 0
        ? ((spaceTrackMetadataCount / metadataCount) * 100).toFixed(1) + "%"
        : "0%";

    const lastCelestrakTask = await this.db
      .select()
      .from(satelliteSyncTasks)
      .where(
        and(
          eq(satelliteSyncTasks.type, "celestrak"),
          eq(satelliteSyncTasks.status, "completed"),
        ),
      )
      .orderBy(desc(satelliteSyncTasks.completedAt))
      .limit(1);

    const lastKeepTrackTask = await this.db
      .select()
      .from(satelliteSyncTasks)
      .where(
        and(
          eq(satelliteSyncTasks.type, "keeptrack-tle"),
          eq(satelliteSyncTasks.status, "completed"),
        ),
      )
      .orderBy(desc(satelliteSyncTasks.completedAt))
      .limit(1);

    const lastKeepTrackMetaTask = await this.db
      .select()
      .from(satelliteSyncTasks)
      .where(
        and(
          eq(satelliteSyncTasks.type, "keeptrack-meta"),
          eq(satelliteSyncTasks.status, "completed"),
        ),
      )
      .orderBy(desc(satelliteSyncTasks.completedAt))
      .limit(1);

    const lastDiscosTask = await this.db
      .select()
      .from(satelliteSyncTasks)
      .where(
        and(
          eq(satelliteSyncTasks.type, "discos"),
          eq(satelliteSyncTasks.status, "completed"),
        ),
      )
      .orderBy(desc(satelliteSyncTasks.completedAt))
      .limit(1);

    const lastSpaceTrackTask = await this.db
      .select()
      .from(satelliteSyncTasks)
      .where(
        and(
          eq(satelliteSyncTasks.type, "space-track"),
          eq(satelliteSyncTasks.status, "completed"),
        ),
      )
      .orderBy(desc(satelliteSyncTasks.completedAt))
      .limit(1);

    const lastSpaceTrackMetaTask = await this.db
      .select()
      .from(satelliteSyncTasks)
      .where(
        and(
          eq(satelliteSyncTasks.type, "space-track-meta"),
          eq(satelliteSyncTasks.status, "completed"),
        ),
      )
      .orderBy(desc(satelliteSyncTasks.completedAt))
      .limit(1);

    return {
      tleCount,
      metadataCount,
      discosCount,
      keepTrackMetadataCount,
      spaceTrackMetadataCount,
      discosCoverage,
      keepTrackCoverage,
      spaceTrackCoverage,
      celestrakCount,
      keepTrackCount,
      spaceTrackTleCount,
      lastCelestrakSync: lastCelestrakTask[0]?.completedAt?.toISOString(),
      lastKeepTrackSync:
        lastKeepTrackMetaTask[0]?.completedAt?.toISOString() ||
        lastKeepTrackTask[0]?.completedAt?.toISOString(),
      lastDiscosSync: lastDiscosTask[0]?.completedAt?.toISOString(),
      lastSpaceTrackSync:
        lastSpaceTrackMetaTask[0]?.completedAt?.toISOString() ||
        lastSpaceTrackTask[0]?.completedAt?.toISOString(),
    };
  }

  async getTaskList(query: TaskListQueryDto): Promise<TaskListResponse> {
    const { page = 1, limit = 10, status, type } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(satelliteSyncTasks.status, status));
    if (type) conditions.push(eq(satelliteSyncTasks.type, type));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const tasks = await this.db
      .select()
      .from(satelliteSyncTasks)
      .where(whereClause)
      .orderBy(desc(satelliteSyncTasks.startedAt))
      .limit(limit)
      .offset(offset);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(satelliteSyncTasks)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    const data: SyncTaskItem[] = tasks.map((task) => ({
      id: task.id,
      type: task.type as SyncType,
      status: task.status as SyncStatus,
      total: task.total,
      processed: task.processed,
      success: task.success,
      failed: task.failed,
      startedAt: task.startedAt?.toISOString() || "",
      completedAt: task.completedAt?.toISOString(),
      error: task.error ?? undefined,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTaskById(taskId: string): Promise<SyncTaskItem | null> {
    const task = await this.db
      .select()
      .from(satelliteSyncTasks)
      .where(eq(satelliteSyncTasks.id, taskId))
      .limit(1);

    if (!task[0]) return null;

    return {
      id: task[0].id,
      type: task[0].type as SyncType,
      status: task[0].status as SyncStatus,
      total: task[0].total,
      processed: task[0].processed,
      success: task[0].success,
      failed: task[0].failed,
      startedAt: task[0].startedAt?.toISOString() || "",
      completedAt: task[0].completedAt?.toISOString(),
      error: task[0].error ?? undefined,
    };
  }

  async getTaskErrors(taskId: string): Promise<ErrorLogListResponse> {
    const errors = await this.db
      .select()
      .from(satelliteSyncErrorLogs)
      .where(eq(satelliteSyncErrorLogs.taskId, taskId))
      .orderBy(desc(satelliteSyncErrorLogs.timestamp));

    const data: ErrorLogItem[] = errors.map((err) => ({
      id: err.id,
      noradId: err.noradId,
      name: err.name ?? undefined,
      source: err.source,
      errorType: err.errorType as SyncErrorType,
      errorMessage: err.errorMessage,
      rawTle: err.rawTle ?? undefined,
      errorDetails: err.errorDetails ?? undefined,
      timestamp: err.timestamp.toISOString(),
    }));

    return { data, total: errors.length };
  }

  async getRecentErrors(
    taskId: string,
    limit: number = 5,
  ): Promise<ErrorLogRecord[]> {
    return this.db
      .select()
      .from(satelliteSyncErrorLogs)
      .where(eq(satelliteSyncErrorLogs.taskId, taskId))
      .orderBy(desc(satelliteSyncErrorLogs.timestamp))
      .limit(limit);
  }

  async getTleList(query: TleListQueryDto): Promise<TleListResponse> {
    const { page = 1, limit = 20, search, source } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (search) {
      conditions.push(
        or(
          like(satelliteTle.name, `%${search}%`),
          like(satelliteTle.noradId, `%${search}%`),
        )!,
      );
    }
    if (source) conditions.push(eq(satelliteTle.source, source));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const tles = await this.db
      .select()
      .from(satelliteTle)
      .where(whereClause)
      .orderBy(desc(satelliteTle.epoch))
      .limit(limit)
      .offset(offset);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(satelliteTle)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    const data: TleItem[] = tles.map((tle) => ({
      noradId: tle.noradId,
      name: tle.name,
      source: tle.source,
      epoch: tle.epoch?.toISOString(),
      inclination: tle.inclination ?? undefined,
      raan: tle.raan ?? undefined,
      eccentricity: tle.eccentricity ?? undefined,
      line1: tle.line1,
      line2: tle.line2,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMetadataList(
    query: MetadataListQueryDto,
  ): Promise<MetadataListResponse> {
    const { page = 1, limit = 20, search } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (search) {
      conditions.push(
        or(
          like(satelliteMetadata.name, `%${search}%`),
          like(satelliteMetadata.noradId, `%${search}%`),
        )!,
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const metas = await this.db
      .select()
      .from(satelliteMetadata)
      .where(whereClause)
      .orderBy(asc(satelliteMetadata.noradId))
      .limit(limit)
      .offset(offset);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(satelliteMetadata)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    const data: MetadataItem[] = metas.map((meta) => ({
      noradId: meta.noradId,
      name: meta.name ?? "",
      countryCode: meta.countryCode ?? undefined,
      launchDate: meta.launchDate
        ? typeof meta.launchDate === "string"
          ? meta.launchDate
          : meta.launchDate.toISOString().split("T")[0]
        : undefined,
      objectType: meta.objectType ?? undefined,
      status: meta.status ?? undefined,
      hasKeepTrackData: meta.hasKeepTrackData,
      hasSpaceTrackData: meta.hasSpaceTrackData,
      hasDiscosData: meta.hasDiscosData,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async startSync(type: SyncType): Promise<TaskRecord> {
    const runningTask = await this.getCurrentStatus();
    if (runningTask && runningTask.status === "running") {
      throw new Error("已有同步任务正在运行，请等待完成后再试");
    }

    const taskId = this.generateTaskId();
    const result = await this.db
      .insert(satelliteSyncTasks)
      .values({
        id: taskId,
        type,
        status: "running",
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        startedAt: new Date(),
      })
      .returning();
    const task = result[0];
    this.currentTask = task;

    this.executeSync(task).catch((error) => {
      this.logger.error(`同步任务失败：${error.message}`);
    });

    return task;
  }

  private async executeSync(task: TaskRecord): Promise<void> {
    this.stopRequested = false;

    try {
      switch (task.type) {
        case "celestrak":
          await this.syncCelestrak(task);
          break;
        case "space-track":
          await this.syncTle(task);
          break;
        case "space-track-meta":
          await this.syncSpaceTrackMetadata(task);
          break;
        case "keeptrack-tle":
          await this.syncKeepTrackBrief(task);
          break;
        case "keeptrack-meta":
          await this.syncKeepTrackDetail(task);
          break;
        case "discos":
          await this.syncDiscos(task);
          break;
      }

      if (this.stopRequested) {
        await this.db
          .update(satelliteSyncTasks)
          .set({
            status: "failed",
            error: "用户请求停止同步",
            completedAt: new Date(),
          })
          .where(eq(satelliteSyncTasks.id, task.id));
        this.logger.log(`同步任务被用户停止：${task.id}`);
      } else {
        await this.db
          .update(satelliteSyncTasks)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(satelliteSyncTasks.id, task.id));
        this.logger.log(`同步任务完成：${task.id}`);
      }
    } catch (error: any) {
      this.logger.error(`同步任务失败: ${error.message}`, error.stack);
      await this.db
        .update(satelliteSyncTasks)
        .set({
          status: "failed",
          error: error.message,
          completedAt: new Date(),
        })
        .where(eq(satelliteSyncTasks.id, task.id));
    } finally {
      this.currentTask = null;
      this.stopRequested = false;
    }
  }

  protected checkStopRequested(): void {
    if (this.stopRequested) {
      this.logger.log("检测到停止请求，提前退出同步");
      throw new Error("用户请求停止同步");
    }
  }

  private async syncCelestrak(task: TaskRecord): Promise<void> {
    this.logger.log("开始 CelesTrak TLE 数据同步...");

    if (this.useMockData) {
      await this.syncCelestrakMock(task);
      return;
    }

    const url = `${this.celestrakBaseUrl}/gp.php?GROUP=active&FORMAT=json`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Nova-Space-Admin/1.0" },
    });
    if (!response.ok) throw new Error(`CelesTrak API 错误：${response.status}`);

    const data: CelestrakGpResponse[] = await response.json();
    this.logger.log(`获取 ${data.length} 条 CelesTrak 数据`);

    await this.db
      .update(satelliteSyncTasks)
      .set({ total: data.length })
      .where(eq(satelliteSyncTasks.id, task.id));

    let success = 0;
    let skipped = 0;

    for (const item of data) {
      try {
        const noradId = this.formatNoradId(item.NORAD_CAT_ID);
        const existing = await this.db
          .select({ source: satelliteTle.source })
          .from(satelliteTle)
          .where(eq(satelliteTle.noradId, noradId))
          .limit(1);

        if (existing[0]) {
          skipped++;
          continue;
        }

        await this.db
          .insert(satelliteTle)
          .values({
            noradId: noradId,
            name: item.OBJECT_NAME,
            source: "celestrak",
            line1: "",
            line2: "",
            epoch: new Date(item.EPOCH),
            inclination: item.INCLINATION,
            raan: item.RA_OF_ASC_NODE,
            eccentricity: item.ECCENTRICITY,
            argOfPerigee: item.ARG_OF_PERICENTER,
            meanMotion: item.MEAN_MOTION,
          })
          .onConflictDoNothing({ target: satelliteTle.noradId });

        success++;
      } catch (error: any) {
        this.logger.warn(`保存失败 (${item.OBJECT_NAME}): ${error.message}`);
      }
    }

    await this.db
      .update(satelliteSyncTasks)
      .set({ success, processed: data.length })
      .where(eq(satelliteSyncTasks.id, task.id));

    this.logger.log(`CelesTrak 同步完成：成功 ${success}, 跳过 ${skipped}`);
  }

  private async syncCelestrakMock(task: TaskRecord): Promise<void> {
    this.logger.log("开始 CelesTrak TLE 数据同步（模拟模式）...");

    const cacheFilePath = join(
      process.cwd(),
      "data",
      "celestrak-tle-cache.json",
    );
    const fs = await import("fs");

    if (!fs.existsSync(cacheFilePath))
      throw new Error(`模拟数据文件不存在：${cacheFilePath}`);

    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));
    this.logger.log(`从缓存文件读取到 ${cacheData.count} 条数据`);

    if (cacheData.count === 0) {
      await this.db
        .update(satelliteSyncTasks)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(satelliteSyncTasks.id, task.id));
      return;
    }

    await this.db
      .update(satelliteSyncTasks)
      .set({ total: cacheData.count })
      .where(eq(satelliteSyncTasks.id, task.id));

    let success = 0,
      skipped = 0,
      failed = 0;

    for (const item of cacheData.data) {
      const noradId = this.formatNoradId(item.NORAD_CAT_ID);

      if (!item.OBJECT_NAME) {
        failed++;
        await this.logSyncError(
          task.id,
          noradId,
          undefined,
          "celestrak",
          "missing_name",
          "卫星数据缺少 OBJECT_NAME 字段",
        );
        continue;
      }

      try {
        await this.db
          .insert(satelliteMetadata)
          .values({
            noradId: noradId,
            hasDiscosData: false,
            hasKeepTrackData: false,
            hasSpaceTrackData: false,
          })
          .onConflictDoNothing({ target: satelliteMetadata.noradId });

        const existing = await this.db
          .select({ source: satelliteTle.source })
          .from(satelliteTle)
          .where(eq(satelliteTle.noradId, noradId))
          .limit(1);

        if (existing[0]) {
          skipped++;
          await this.logSyncError(
            task.id,
            noradId,
            item.OBJECT_NAME,
            "celestrak",
            "duplicate",
            `已有 ${existing[0].source} 数据源的数据`,
          );
          continue;
        }

        await this.db
          .insert(satelliteTle)
          .values({
            noradId: noradId,
            name: item.OBJECT_NAME,
            source: "celestrak",
            line1: "",
            line2: "",
            epoch: item.EPOCH ? new Date(item.EPOCH) : undefined,
            inclination: item.INCLINATION
              ? parseFloat(item.INCLINATION)
              : undefined,
            raan: item.RA_OF_ASC_NODE
              ? parseFloat(item.RA_OF_ASC_NODE)
              : undefined,
            eccentricity: item.ECCENTRICITY
              ? parseFloat(item.ECCENTRICITY)
              : undefined,
            argOfPerigee: item.ARG_OF_PERICENTER
              ? parseFloat(item.ARG_OF_PERICENTER)
              : undefined,
            meanMotion: item.MEAN_MOTION
              ? parseFloat(item.MEAN_MOTION)
              : undefined,
          })
          .onConflictDoNothing({ target: satelliteTle.noradId });

        success++;
      } catch (dbError: any) {
        failed++;
        await this.logSyncError(
          task.id,
          noradId,
          item.OBJECT_NAME,
          "celestrak",
          "database",
          dbError.message,
          undefined,
          this.extractErrorDetails(dbError),
        );
      }

      await this.db
        .update(satelliteSyncTasks)
        .set({ processed: success + skipped + failed, success, failed })
        .where(eq(satelliteSyncTasks.id, task.id));
    }

    await this.db
      .update(satelliteSyncTasks)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(satelliteSyncTasks.id, task.id));
    this.logger.log(
      `CelesTrak（模拟）同步完成：成功 ${success}, 跳过 ${skipped}, 失败 ${failed}`,
    );
  }

  private async syncTle(task: TaskRecord): Promise<void> {
    this.logger.log("开始 Space-Track TLE 数据同步...");

    if (this.useMockData) {
      await this.syncTleMock(task);
      return;
    }

    if (!this.spaceTrackUsername || !this.spaceTrackPassword)
      throw new Error("Space-Track 凭据未配置");

    await this.loginSpaceTrack();

    const batches = [
      { range: "1--9999", name: "早期卫星" },
      { range: "10000--19999", name: "1980s-1990s" },
      { range: "20000--29999", name: "1990s-2000s" },
      { range: "30000--39999", name: "2000s-2010s" },
      { range: "40000--49999", name: "2010s-2020s" },
      { range: "50000--99999", name: "2020s 至今" },
    ];

    let totalProcessed = 0,
      totalSuccess = 0,
      totalFailed = 0;
    const batchErrors: string[] = [];

    for (const batch of batches) {
      this.checkStopRequested();

      try {
        const gpData = await this.fetchGpBatch(batch.range);
        const result = await this.processAndStoreGpData(task.id, gpData);
        totalProcessed += gpData.length;
        totalSuccess += result.success;
        totalFailed += result.failed;

        await this.db
          .update(satelliteSyncTasks)
          .set({
            total: totalProcessed,
            processed: totalProcessed,
            success: totalSuccess,
            failed: totalFailed,
          })
          .where(eq(satelliteSyncTasks.id, task.id));

        await this.sleep(this.BATCH_INTERVAL_MS);
      } catch (error: any) {
        this.logger.error(`批次 ${batch.name} 失败：${error.message}`);
        batchErrors.push(`${batch.name}: ${error.message}`);
      }
    }

    if (totalSuccess === 0 && batchErrors.length > 0)
      throw new Error(`所有批次均失败：${batchErrors.join("; ")}`);
  }

  private async loginSpaceTrack(): Promise<void> {
    const https = await import("https");
    const url = `${this.spaceTrackBaseUrl}/ajaxauth/login`;

    return new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Nova-Space-Admin/1.0",
          },
          timeout: 60000,
        },
        (res) => {
          res.on("data", () => {});
          res.on("end", () => {
            if (res.statusCode !== 200)
              return reject(new Error(`登录失败，状态码：${res.statusCode}`));
            const cookies = res.headers["set-cookie"];
            if (cookies) {
              this.sessionCookie = cookies
                .map((c) => c.split(";")[0])
                .join("; ");
              this.cookieExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);
              resolve();
            } else reject(new Error("未获取到 session cookie"));
          });
        },
      );

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("登录超时"));
      });
      req.write(
        `identity=${encodeURIComponent(this.spaceTrackUsername)}&password=${encodeURIComponent(this.spaceTrackPassword)}`,
      );
      req.end();
    });
  }

  private async fetchGpBatch(
    noradRange: string,
  ): Promise<SpaceTrackGpResponse[]> {
    const https = await import("https");
    const url = `${this.spaceTrackBaseUrl}/basicspacedata/query/class/gp/OBJECT_TYPE/PAYLOAD/decay_date/null-val/epoch/%3Enow-10/NORAD_CAT_ID/${noradRange}/format/json`;

    return new Promise((resolve, reject) => {
      const req = https.get(
        url,
        {
          headers: {
            Cookie: this.sessionCookie,
            "User-Agent": "Nova-Space-Admin/1.0",
          },
          timeout: 180000,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            if (res.statusCode === 429)
              return reject(new Error("429 rate limit exceeded"));
            if (res.statusCode && res.statusCode !== 200)
              return reject(new Error(`HTTP ${res.statusCode}`));
            try {
              if (data.startsWith("<") || data.startsWith("Invalid"))
                return reject(new Error(`API 错误：${data.substring(0, 50)}`));
              resolve(JSON.parse(data));
            } catch {
              reject(new Error("JSON 解析失败"));
            }
          });
        },
      );
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("请求超时"));
      });
    });
  }

  private async processAndStoreGpData(
    taskId: string,
    gpData: SpaceTrackGpResponse[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0,
      failed = 0;

    for (const item of gpData) {
      try {
        const noradId = this.formatNoradId(item.NORAD_CAT_ID);

        await this.db
          .insert(satelliteTle)
          .values({
            noradId: noradId,
            name: item.OBJECT_NAME,
            source: "space-track",
            line1: item.TLE_LINE1,
            line2: item.TLE_LINE2,
            epoch: item.EPOCH ? new Date(item.EPOCH) : undefined,
            inclination: item.INCLINATION
              ? parseFloat(item.INCLINATION)
              : undefined,
            raan: item.RA_OF_ASC_NODE
              ? parseFloat(item.RA_OF_ASC_NODE)
              : undefined,
            eccentricity: item.ECCENTRICITY
              ? parseFloat(item.ECCENTRICITY)
              : undefined,
            argOfPerigee: item.ARG_OF_PERICENTER
              ? parseFloat(item.ARG_OF_PERICENTER)
              : undefined,
            meanMotion: item.MEAN_MOTION
              ? parseFloat(item.MEAN_MOTION)
              : undefined,
          })
          .onConflictDoUpdate({
            target: satelliteTle.noradId,
            set: {
              name: item.OBJECT_NAME,
              line1: item.TLE_LINE1,
              line2: item.TLE_LINE2,
              updatedAt: new Date(),
            },
          });

        await this.upsertMetadata(item);
        success++;
      } catch (error: any) {
        failed++;
        await this.logSyncError(
          taskId,
          this.formatNoradId(item.NORAD_CAT_ID),
          item.OBJECT_NAME,
          "space-track",
          "database",
          error.message,
          undefined,
          this.extractErrorDetails(error),
        );
      }
    }

    return { success, failed };
  }

  private async upsertMetadata(item: SpaceTrackGpResponse): Promise<void> {
    const noradId = this.formatNoradId(item.NORAD_CAT_ID);
    const existing = await this.db
      .select()
      .from(satelliteMetadata)
      .where(eq(satelliteMetadata.noradId, noradId))
      .limit(1);

    const epochDate = item.EPOCH ? new Date(item.EPOCH) : undefined;
    const tleAge = epochDate
      ? Math.floor((Date.now() - epochDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    const parseDate = (dateStr: string | undefined): Date | undefined => {
      if (!dateStr) return undefined;
      try {
        return new Date(dateStr);
      } catch {
        return undefined;
      }
    };

    const metadataValues = {
      name: item.OBJECT_NAME,
      objectId: item.OBJECT_ID,
      countryCode: item.COUNTRY_CODE,
      launchDate: parseDate(item.LAUNCH_DATE),
      launchSite: item.SITE,
      objectType: item.OBJECT_TYPE,
      rcs: item.RCS_SIZE,
      decayDate: parseDate(item.DECAY_DATE ?? undefined),
      period: item.PERIOD ? parseFloat(item.PERIOD) : undefined,
      inclination: item.INCLINATION ? parseFloat(item.INCLINATION) : undefined,
      eccentricity: item.ECCENTRICITY
        ? parseFloat(item.ECCENTRICITY)
        : undefined,
      raan: item.RA_OF_ASC_NODE ? parseFloat(item.RA_OF_ASC_NODE) : undefined,
      argOfPerigee: item.ARG_OF_PERICENTER
        ? parseFloat(item.ARG_OF_PERICENTER)
        : undefined,
      apogee: item.APOAPSIS ? parseFloat(item.APOAPSIS) : undefined,
      perigee: item.PERIAPSIS ? parseFloat(item.PERIAPSIS) : undefined,
      tleEpoch: epochDate,
      tleAge: tleAge,
      hasSpaceTrackData: true,
    };

    if (existing[0]) {
      await this.db
        .update(satelliteMetadata)
        .set(metadataValues)
        .where(eq(satelliteMetadata.noradId, noradId));
    } else {
      await this.db.insert(satelliteMetadata).values({
        noradId: noradId,
        ...metadataValues,
        hasDiscosData: false,
        hasKeepTrackData: false,
      });
    }
  }

  private async syncKeepTrackBrief(task: TaskRecord): Promise<void> {
    this.logger.log("开始 KeepTrack TLE 数据同步...");

    if (this.useMockData) {
      await this.syncKeepTrackBriefMock(task);
      return;
    }

    if (!this.keepTrackApiKey) {
      await this.db
        .update(satelliteSyncTasks)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(satelliteSyncTasks.id, task.id));
      return;
    }

    const response = await fetch(`${this.keepTrackBaseUrl}/sats/brief`, {
      headers: { "X-API-Key": this.keepTrackApiKey },
    });
    if (!response.ok) throw new Error(`KeepTrack API 错误：${response.status}`);

    const data: KeepTrackBriefResponse[] = await response.json();
    await this.db
      .update(satelliteSyncTasks)
      .set({ total: data.length })
      .where(eq(satelliteSyncTasks.id, task.id));

    let success = 0;
    for (const sat of data) {
      if (!sat.status) {
        continue;
      }
      try {
        const noradId = this.extractNoradId(sat.tle1);
        await this.db
          .insert(satelliteMetadata)
          .values({
            noradId: noradId,
            hasDiscosData: false,
            hasKeepTrackData: false,
            hasSpaceTrackData: false,
          })
          .onConflictDoNothing({ target: satelliteMetadata.noradId });

        await this.db
          .insert(satelliteTle)
          .values({
            noradId: noradId,
            name: sat.name,
            source: "keeptrack",
            line1: sat.tle1,
            line2: sat.tle2,
          })
          .onConflictDoUpdate({
            target: satelliteTle.noradId,
            set: {
              name: sat.name,
              line1: sat.tle1,
              line2: sat.tle2,
              updatedAt: new Date(),
            },
          });
        success++;
      } catch (error: any) {
        this.logger.warn(`保存失败 (${sat.name}): ${error.message}`);
      }
    }

    await this.db
      .update(satelliteSyncTasks)
      .set({ success, processed: data.length })
      .where(eq(satelliteSyncTasks.id, task.id));
    this.logger.log(`KeepTrack TLE 同步完成：成功 ${success}`);
  }

  private async syncKeepTrackBriefMock(task: TaskRecord): Promise<void> {
    this.logger.log("开始 KeepTrack TLE 数据同步（模拟模式）...");

    const cacheFilePath = join(
      process.cwd(),
      "data",
      "keeptrack-tle-cache.json",
    );
    const fs = await import("fs");
    if (!fs.existsSync(cacheFilePath))
      throw new Error(`模拟数据文件不存在：${cacheFilePath}`);

    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));
    if (cacheData.count === 0) {
      await this.db
        .update(satelliteSyncTasks)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(satelliteSyncTasks.id, task.id));
      return;
    }

    await this.db
      .update(satelliteSyncTasks)
      .set({ total: cacheData.count })
      .where(eq(satelliteSyncTasks.id, task.id));

    let success = 0,
      skipped = 0,
      failed = 0;

    for (const sat of cacheData.data) {
      if (!sat.status) {
        skipped++;
        continue;
      }

      let noradId: string;
      try {
        noradId = this.extractNoradId(sat.tle1);
      } catch {
        failed++;
        await this.logSyncError(
          task.id,
          "UNKNOWN",
          sat.name,
          "keeptrack",
          "parse_error",
          "TLE 解析失败",
        );
        continue;
      }

      if (!sat.name) {
        failed++;
        await this.logSyncError(
          task.id,
          noradId,
          undefined,
          "keeptrack",
          "missing_name",
          "缺少 name 字段",
        );
        continue;
      }

      try {
        await this.db
          .insert(satelliteMetadata)
          .values({
            noradId: noradId,
            hasDiscosData: false,
            hasKeepTrackData: false,
            hasSpaceTrackData: false,
          })
          .onConflictDoNothing({ target: satelliteMetadata.noradId });

        const existing = await this.db
          .select({ source: satelliteTle.source })
          .from(satelliteTle)
          .where(eq(satelliteTle.noradId, noradId))
          .limit(1);

        if (existing[0]) {
          skipped++;
          await this.logSyncError(
            task.id,
            noradId,
            sat.name,
            "keeptrack",
            "duplicate",
            `已有 ${existing[0].source} 数据源的数据`,
          );
          continue;
        }

        await this.db
          .insert(satelliteTle)
          .values({
            noradId: noradId,
            name: sat.name,
            source: "keeptrack",
            line1: sat.tle1,
            line2: sat.tle2,
          })
          .onConflictDoNothing({ target: satelliteTle.noradId });

        success++;
      } catch (dbError: any) {
        failed++;
        await this.logSyncError(
          task.id,
          noradId,
          sat.name,
          "keeptrack",
          "database",
          dbError.message,
          undefined,
          this.extractErrorDetails(dbError),
        );
      }

      if ((success + skipped + failed) % 100 === 0) {
        await this.db
          .update(satelliteSyncTasks)
          .set({ processed: success + skipped + failed, success, failed })
          .where(eq(satelliteSyncTasks.id, task.id));
      }
    }

    await this.db
      .update(satelliteSyncTasks)
      .set({
        processed: success + skipped + failed,
        success,
        failed,
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(satelliteSyncTasks.id, task.id));
    this.logger.log(
      `KeepTrack TLE（模拟）同步完成：成功 ${success}, 跳过 ${skipped}, 失败 ${failed}`,
    );
  }

  private async syncKeepTrackDetail(task: TaskRecord): Promise<void> {
    this.logger.log("开始 KeepTrack 元数据同步...");

    if (!this.keepTrackApiKey) {
      await this.db
        .update(satelliteSyncTasks)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(satelliteSyncTasks.id, task.id));
      return;
    }

    const satellites = await this.db
      .select({ noradId: satelliteMetadata.noradId })
      .from(satelliteMetadata)
      .where(eq(satelliteMetadata.hasKeepTrackData, false))
      .limit(60);

    if (satellites.length === 0) {
      await this.db
        .update(satelliteSyncTasks)
        .set({ total: 0, processed: 0, success: 0 })
        .where(eq(satelliteSyncTasks.id, task.id));
      return;
    }

    await this.db
      .update(satelliteSyncTasks)
      .set({ total: satellites.length })
      .where(eq(satelliteSyncTasks.id, task.id));

    let success = 0,
      failed = 0;

    for (const sat of satellites) {
      this.checkStopRequested();

      try {
        const response = await fetch(
          `${this.keepTrackBaseUrl}/sat/${sat.noradId}`,
          { headers: { "X-API-Key": this.keepTrackApiKey } },
        );

        if (response.ok) {
          const detail: KeepTrackSatDetailResponse = await response.json();
          try {
            await this.saveKeepTrackMetadata(sat.noradId, detail);
            success++;
          } catch (dbError: any) {
            failed++;
            await this.logSyncError(
              task.id,
              sat.noradId,
              detail.NAME,
              "keeptrack",
              "database",
              dbError.message,
              undefined,
              this.extractErrorDetails(dbError),
            );
          }
        } else {
          failed++;
          const errorType =
            response.status === 403 || response.status === 429
              ? "rate_limit"
              : "api_error";
          await this.logSyncError(
            task.id,
            sat.noradId,
            undefined,
            "keeptrack",
            errorType,
            `API 返回 ${response.status}`,
          );
        }

        await this.sleep(this.getRandomKeepTrackDelay());
      } catch (error: any) {
        if (error.message === "用户请求停止同步") throw error;
        failed++;
        const errorType =
          error.message.includes("Failed query") ||
          error.message.includes("database")
            ? "database"
            : "network";
        await this.logSyncError(
          task.id,
          sat.noradId,
          undefined,
          "keeptrack",
          errorType,
          error.message,
          undefined,
          this.extractErrorDetails(error),
        );
      }

      await this.db
        .update(satelliteSyncTasks)
        .set({ processed: success + failed, success, failed })
        .where(eq(satelliteSyncTasks.id, task.id));
    }

    this.logger.log(
      `KeepTrack 元数据同步完成：成功 ${success}, 失败 ${failed}`,
    );
  }

  private async saveKeepTrackMetadata(
    noradId: string,
    detail: KeepTrackSatDetailResponse,
  ): Promise<void> {
    const objectTypeMap: Record<number, string> = {
      1: "PAYLOAD",
      2: "ROCKET_BODY",
      3: "DEBRIS",
      4: "UNKNOWN",
      5: "SPECIAL",
    };
    const period =
      detail.MEAN_MOTION && detail.MEAN_MOTION > 0
        ? 1440 / detail.MEAN_MOTION
        : undefined;

    const epochDate = this.parseKeepTrackDate(detail.EPOCH);
    const tleAge = epochDate
      ? Math.floor((Date.now() - epochDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    const updateData = {
      name: detail.NAME,
      objectId: detail.OBJECT_ID,
      altName: detail.ALT_NAME,
      countryCode:
        detail.COUNTRY &&
        detail.COUNTRY.length <= 20 &&
        !detail.COUNTRY.includes("/") &&
        !detail.COUNTRY.includes(" ")
          ? detail.COUNTRY
          : undefined,
      objectType: detail.TYPE
        ? objectTypeMap[detail.TYPE] || `TYPE_${detail.TYPE}`
        : undefined,
      operator: detail.OWNER,
      manufacturer: detail.MANUFACTURER,
      contractor: detail.MANUFACTURER,
      bus: detail.BUS,
      configuration: detail.CONFIGURATION,
      shape: detail.SHAPE,
      lifetime: detail.LIFETIME,
      std_mag: detail.VMAG,
      launchDate: this.parseKeepTrackDate(detail.LAUNCH_DATE),
      stableDate: this.parseKeepTrackDate(detail.STABLE_DATE),
      launchSite: detail.LAUNCH_SITE,
      launchPad: detail.LAUNCH_PAD,
      launchVehicle: detail.LAUNCH_VEHICLE,
      mission: detail.MISSION,
      purpose: detail.PURPOSE,
      power: detail.POWER,
      motor: detail.MOTOR,
      length: detail.LENGTH ? parseFloat(detail.LENGTH) : undefined,
      diameter: detail.DIAMETER ? parseFloat(detail.DIAMETER) : undefined,
      span: detail.SPAN ? parseFloat(detail.SPAN) : undefined,
      dryMass: detail.DRY_MASS ? parseFloat(detail.DRY_MASS) : undefined,
      launchMass: detail.LAUNCH_MASS
        ? parseFloat(detail.LAUNCH_MASS)
        : undefined,
      equipment: detail.EQUIPMENT,
      adcs: detail.ADCS,
      payload: detail.PAYLOAD,
      constellationName: detail.CONSTELLATION_NAME,
      color: detail.COLOR,
      materialComposition: detail.MATERIAL_COMPOSITION,
      majorEvents: detail.MAJOR_EVENTS,
      relatedSatellites: detail.RELATED_SATELLITES,
      transmitterFrequencies: detail.TRANSMITTER_FREQUENCIES,
      sources: detail.SOURCES,
      referenceUrls: detail.reference_urls,
      summary: detail.summary,
      anomalyFlags: detail.anomaly_flags,
      lastReviewed: this.parseKeepTrackDate(detail.last_reviewed),
      period,
      inclination: detail.INCLINATION,
      raan: detail.RA_OF_ASC_NODE,
      argOfPerigee: detail.ARG_OF_PERICENTER,
      rcs: detail.RCS,
      tleEpoch: epochDate,
      tleAge: tleAge,
      decayDate: this.parseKeepTrackDate(detail.DECAY_DATE),
      status: detail.STATUS,
      hasKeepTrackData: true,
    };

    await this.db
      .update(satelliteMetadata)
      .set(updateData)
      .where(eq(satelliteMetadata.noradId, noradId));
  }

  private parseKeepTrackDate(dateStr: string | undefined): Date | undefined {
    if (!dateStr) return undefined;
    // 过滤无效格式：以 + 开头（日本年号错误）或年号异常（045xxx）
    if (dateStr.startsWith("+") || /^\d{6}/.test(dateStr)) return undefined;
    try {
      const fixed = dateStr.replace(/(\d{2})(\d{2}):(\d{2})$/, "$1:$2:$3");
      const parsed = new Date(fixed);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    } catch {
      return undefined;
    }
  }

  private parseKeepTrackDateString(
    dateStr: string | undefined,
  ): string | undefined {
    const date = this.parseKeepTrackDate(dateStr);
    return date ? date.toISOString().split("T")[0] : undefined;
  }

  private extractNoradId(tle1: string): string {
    const match = tle1.match(/^1\s+(\d+)/);
    if (match) return match[1].padStart(5, "0");
    throw new Error(`无法从 TLE 提取 NORAD ID: ${tle1}`);
  }

  private async syncSpaceTrackMetadata(task: TaskRecord): Promise<void> {
    this.logger.log("开始 Space-Track 元数据同步...");

    if (this.useMockData) {
      await this.syncSpaceTrackMetadataMock(task);
      return;
    }

    if (!this.spaceTrackUsername || !this.spaceTrackPassword)
      throw new Error("Space-Track 凭据未配置");
    await this.loginSpaceTrack();

    const metadataList = await this.db
      .select({ noradId: satelliteMetadata.noradId })
      .from(satelliteMetadata)
      .where(eq(satelliteMetadata.hasSpaceTrackData, false));

    if (metadataList.length === 0) {
      await this.db
        .update(satelliteSyncTasks)
        .set({ total: 0, processed: 0, success: 0 })
        .where(eq(satelliteSyncTasks.id, task.id));
      return;
    }

    await this.db
      .update(satelliteSyncTasks)
      .set({ total: metadataList.length })
      .where(eq(satelliteSyncTasks.id, task.id));

    const batches = [
      { range: "1--9999", name: "早期卫星" },
      { range: "10000--19999", name: "1980s-1990s" },
      { range: "20000--29999", name: "1990s-2000s" },
      { range: "30000--39999", name: "2000s-2010s" },
      { range: "40000--49999", name: "2010s-2020s" },
      { range: "50000--99999", name: "2020s 至今" },
    ];

    const noradIdSet = new Set(metadataList.map((m) => m.noradId));
    let totalProcessed = 0,
      totalSuccess = 0,
      totalFailed = 0;

    for (const batch of batches) {
      this.checkStopRequested();

      try {
        const gpData = await this.fetchGpBatch(batch.range);

        for (const item of gpData) {
          const noradId = this.formatNoradId(item.NORAD_CAT_ID);
          if (!noradIdSet.has(noradId)) continue;

          try {
            await this.upsertMetadata(item);
            totalSuccess++;
          } catch {
            totalFailed++;
          }
          totalProcessed++;
        }

        await this.db
          .update(satelliteSyncTasks)
          .set({
            processed: totalProcessed,
            success: totalSuccess,
            failed: totalFailed,
          })
          .where(eq(satelliteSyncTasks.id, task.id));
        await this.sleep(this.BATCH_INTERVAL_MS);
      } catch (error: any) {
        this.logger.error(`批次 ${batch.name} 失败：${error.message}`);
      }
    }
  }

  private async syncSpaceTrackMetadataMock(task: TaskRecord): Promise<void> {
    this.logger.log("开始 Space-Track 元数据同步（模拟模式）...");

    const cacheFilePath = join(
      process.cwd(),
      "data",
      "space-track-tle-cache.json",
    );
    const fs = await import("fs");
    if (!fs.existsSync(cacheFilePath))
      throw new Error(`模拟数据文件不存在：${cacheFilePath}`);

    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));

    const metadataList = await this.db
      .select({ noradId: satelliteMetadata.noradId })
      .from(satelliteMetadata)
      .where(eq(satelliteMetadata.hasSpaceTrackData, false));

    if (metadataList.length === 0) {
      await this.db
        .update(satelliteSyncTasks)
        .set({ total: 0, processed: 0, success: 0 })
        .where(eq(satelliteSyncTasks.id, task.id));
      return;
    }

    await this.db
      .update(satelliteSyncTasks)
      .set({ total: metadataList.length })
      .where(eq(satelliteSyncTasks.id, task.id));

    const gpDataMap = new Map<string, SpaceTrackGpResponse>();
    for (const item of cacheData.data)
      gpDataMap.set(this.formatNoradId(item.NORAD_CAT_ID), item);

    let success = 0,
      failed = 0;

    for (const meta of metadataList) {
      const gpItem = gpDataMap.get(meta.noradId);
      if (gpItem) {
        try {
          await this.upsertMetadata(gpItem);
          success++;
        } catch {
          failed++;
        }
      } else {
        success++;
      }
    }

    await this.db
      .update(satelliteSyncTasks)
      .set({ processed: metadataList.length, success, failed })
      .where(eq(satelliteSyncTasks.id, task.id));
    this.logger.log(
      `Space-Track 元数据（模拟）同步完成：成功 ${success}, 失败 ${failed}`,
    );
  }

  private async syncDiscos(task: TaskRecord): Promise<void> {
    this.logger.log("开始 ESA DISCOS 数据同步...");

    if (!this.esaDiscosApiToken) throw new Error("ESA DISCOS API Token 未配置");

    const metadataList = await this.db
      .select({ noradId: satelliteMetadata.noradId })
      .from(satelliteMetadata)
      .where(eq(satelliteMetadata.hasDiscosData, false));

    await this.db
      .update(satelliteSyncTasks)
      .set({ total: metadataList.length })
      .where(eq(satelliteSyncTasks.id, task.id));

    const BATCH_SIZE = 100;
    let success = 0,
      failed = 0;

    for (let i = 0; i < metadataList.length; i += BATCH_SIZE) {
      const batch = metadataList.slice(i, i + BATCH_SIZE);
      const noradIds = batch.map((m) => m.noradId);

      try {
        const discosDataMap = await this.fetchDiscosDataBatch(noradIds);

        for (const meta of batch) {
          const discosInfo = discosDataMap.get(meta.noradId);
          if (discosInfo) {
            await this.updateMetadataWithDiscos(meta.noradId, discosInfo);
            success++;
          } else {
            await this.db
              .update(satelliteMetadata)
              .set({ hasDiscosData: true })
              .where(eq(satelliteMetadata.noradId, meta.noradId));
            success++;
          }
        }
      } catch {
        for (const meta of batch) {
          try {
            const discosInfo = await this.fetchDiscosData(meta.noradId);
            if (discosInfo) {
              await this.updateMetadataWithDiscos(meta.noradId, discosInfo);
              success++;
            } else {
              await this.db
                .update(satelliteMetadata)
                .set({ hasDiscosData: true })
                .where(eq(satelliteMetadata.noradId, meta.noradId));
              success++;
            }
          } catch {
            failed++;
          }
        }
      }

      await this.db
        .update(satelliteSyncTasks)
        .set({ success, failed })
        .where(eq(satelliteSyncTasks.id, task.id));
      await this.sleep(this.BATCH_INTERVAL_MS);
    }

    this.logger.log(`ESA DISCOS 同步完成：成功 ${success}, 失败 ${failed}`);
  }

  private async fetchDiscosDataBatch(
    noradIds: string[],
  ): Promise<Map<string, any>> {
    const numericIds = noradIds
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));
    const url = `${this.esaDiscosBaseUrl}/objects?filter=satno=in=(${numericIds.join(",")})&include=operators,launch,launch.vehicle,launch.site&page[size]=${numericIds.length}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.esaDiscosApiToken}`,
        Accept: "application/vnd.api+json",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        await this.sleep(
          parseInt(response.headers.get("Retry-After") || "60") * 1000,
        );
        return this.fetchDiscosDataBatch(noradIds);
      }
      throw new Error(`ESA DISCOS API 错误: ${response.status}`);
    }

    const json: DiscosResponse = await response.json();
    const result = new Map<string, any>();

    if (!json.data || json.data.length === 0) return result;

    const included = json.included || [];

    for (const item of json.data) {
      const attrs = item.attributes;
      const noradId = String(attrs.satno).padStart(5, "0");

      let operator: string | undefined;
      if (item.relationships?.operators?.data?.length) {
        const operatorId = item.relationships.operators.data[0]?.id;
        if (operatorId) {
          const operatorData = included.find(
            (inc) => inc.type === "organisation" && inc.id === operatorId,
          );
          operator = operatorData?.attributes?.name;
        }
      }

      let launchVehicle: string | undefined, launchSiteName: string | undefined;
      if (item.relationships?.launch?.data) {
        const launchId = item.relationships.launch.data.id;
        const launchData = included.find(
          (inc) => inc.type === "launch" && inc.id === launchId,
        );

        if (launchData) {
          const vehicleId = launchData.relationships?.vehicle?.data?.id;
          if (vehicleId) {
            const vehicleData = included.find(
              (inc) => inc.type === "vehicle" && inc.id === vehicleId,
            );
            launchVehicle = vehicleData?.attributes?.name;
          }
          const siteId = launchData.relationships?.site?.data?.id;
          if (siteId) {
            const siteData = included.find(
              (inc) => inc.type === "launchSite" && inc.id === siteId,
            );
            launchSiteName = siteData?.attributes?.name;
          }
        }
      }

      result.set(noradId, {
        cosparId: attrs.cosparId,
        objectClass: attrs.objectClass,
        mass: attrs.mass,
        shape: attrs.shape,
        width: attrs.width,
        height: attrs.height,
        depth: attrs.depth,
        span: attrs.span,
        mission: attrs.mission,
        firstEpoch: attrs.firstEpoch,
        operator,
        predDecayDate: attrs.predDecayDate,
        launchVehicle,
        launchSiteName,
      });
    }

    return result;
  }

  private async fetchDiscosData(noradId: string): Promise<any> {
    const numericId = parseInt(noradId, 10);
    const url = `${this.esaDiscosBaseUrl}/objects?filter=satno=${numericId}&include=operators,launch,launch.vehicle,launch.site`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.esaDiscosApiToken}`,
        Accept: "application/vnd.api+json",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        await this.sleep(
          parseInt(response.headers.get("Retry-After") || "60") * 1000,
        );
        return this.fetchDiscosData(noradId);
      }
      return null;
    }

    const json: DiscosResponse = await response.json();
    if (!json.data || json.data.length === 0) return null;

    const item = json.data[0];
    const attrs = item.attributes;
    const included = json.included || [];

    let operator: string | undefined;
    if (item.relationships?.operators?.data?.length) {
      const operatorId = item.relationships.operators.data[0]?.id;
      if (operatorId) {
        const operatorData = included.find(
          (inc) => inc.type === "organisation" && inc.id === operatorId,
        );
        operator = operatorData?.attributes?.name;
      }
    }

    let launchVehicle: string | undefined, launchSiteName: string | undefined;
    if (item.relationships?.launch?.data) {
      const launchId = item.relationships.launch.data.id;
      const launchData = included.find(
        (inc) => inc.type === "launch" && inc.id === launchId,
      );

      if (launchData) {
        const vehicleId = launchData.relationships?.vehicle?.data?.id;
        if (vehicleId) {
          const vehicleData = included.find(
            (inc) => inc.type === "vehicle" && inc.id === vehicleId,
          );
          launchVehicle = vehicleData?.attributes?.name;
        }
        const siteId = launchData.relationships?.site?.data?.id;
        if (siteId) {
          const siteData = included.find(
            (inc) => inc.type === "launchSite" && inc.id === siteId,
          );
          launchSiteName = siteData?.attributes?.name;
        }
      }
    }

    return {
      cosparId: attrs.cosparId,
      objectClass: attrs.objectClass,
      mass: attrs.mass,
      shape: attrs.shape,
      width: attrs.width,
      height: attrs.height,
      depth: attrs.depth,
      span: attrs.span,
      mission: attrs.mission,
      firstEpoch: attrs.firstEpoch,
      operator,
      predDecayDate: attrs.predDecayDate,
      launchVehicle,
      launchSiteName,
    };
  }

  private async updateMetadataWithDiscos(
    noradId: string,
    info: any,
  ): Promise<void> {
    const dimensions = this.formatDimensions(info);

    const updateData = {
      cosparId: info.cosparId,
      objectClass: info.objectClass,
      launchMass: info.mass,
      shape: info.shape,
      dimensions,
      span: info.span,
      mission: info.mission,
      firstEpoch: info.firstEpoch,
      operator: info.operator,
      predDecayDate: info.predDecayDate,
      hasDiscosData: true,
      launchVehicle: info.launchVehicle,
      launchSiteName: info.launchSiteName,
    };

    await this.db
      .update(satelliteMetadata)
      .set(updateData)
      .where(eq(satelliteMetadata.noradId, noradId));
  }

  private formatDimensions(info: any): string | undefined {
    if (!info.width && !info.height && !info.depth) return undefined;
    const parts: string[] = [];
    if (info.width) parts.push(`${info.width}m`);
    if (info.height) parts.push(`${info.height}m`);
    if (info.depth) parts.push(`${info.depth}m`);
    return parts.length > 0 ? parts.join(" × ") : undefined;
  }

  private async syncTleMock(task: TaskRecord): Promise<void> {
    this.logger.log("开始 Space-Track TLE 数据同步（模拟模式）...");

    const cacheFilePath = join(
      process.cwd(),
      "data",
      "space-track-tle-cache.json",
    );
    const fs = await import("fs");
    if (!fs.existsSync(cacheFilePath))
      throw new Error(`模拟数据文件不存在：${cacheFilePath}`);

    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));
    await this.db
      .update(satelliteSyncTasks)
      .set({ total: cacheData.count })
      .where(eq(satelliteSyncTasks.id, task.id));

    let success = 0,
      failed = 0;

    for (const item of cacheData.data) {
      const noradId = this.formatNoradId(item.NORAD_CAT_ID);
      const rawTle =
        item.TLE_LINE1 && item.TLE_LINE2
          ? `${item.TLE_LINE1}\n${item.TLE_LINE2}`
          : undefined;

      if (!item.OBJECT_NAME) {
        failed++;
        await this.logSyncError(
          task.id,
          noradId,
          undefined,
          "space-track",
          "missing_name",
          "缺少 OBJECT_NAME 字段",
          rawTle,
        );
        continue;
      }

      try {
        await this.db
          .insert(satelliteMetadata)
          .values({
            noradId: noradId,
            hasDiscosData: false,
            hasKeepTrackData: false,
            hasSpaceTrackData: false,
          })
          .onConflictDoNothing({ target: satelliteMetadata.noradId });

        await this.db
          .insert(satelliteTle)
          .values({
            noradId: noradId,
            name: item.OBJECT_NAME,
            source: "space-track",
            line1: item.TLE_LINE1,
            line2: item.TLE_LINE2,
            epoch: item.EPOCH ? new Date(item.EPOCH) : undefined,
            inclination: item.INCLINATION
              ? parseFloat(item.INCLINATION)
              : undefined,
            raan: item.RA_OF_ASC_NODE
              ? parseFloat(item.RA_OF_ASC_NODE)
              : undefined,
            eccentricity: item.ECCENTRICITY
              ? parseFloat(item.ECCENTRICITY)
              : undefined,
            argOfPerigee: item.ARG_OF_PERICENTER
              ? parseFloat(item.ARG_OF_PERICENTER)
              : undefined,
            meanMotion: item.MEAN_MOTION
              ? parseFloat(item.MEAN_MOTION)
              : undefined,
          })
          .onConflictDoUpdate({
            target: satelliteTle.noradId,
            set: {
              name: item.OBJECT_NAME,
              line1: item.TLE_LINE1,
              line2: item.TLE_LINE2,
              updatedAt: new Date(),
            },
          });

        success++;
      } catch (dbError: any) {
        failed++;
        await this.logSyncError(
          task.id,
          noradId,
          item.OBJECT_NAME,
          "space-track",
          "database",
          dbError.message,
          rawTle,
          this.extractErrorDetails(dbError),
        );
      }

      await this.db
        .update(satelliteSyncTasks)
        .set({ processed: success + failed, success, failed })
        .where(eq(satelliteSyncTasks.id, task.id));
    }

    await this.db
      .update(satelliteSyncTasks)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(satelliteSyncTasks.id, task.id));
    this.logger.log(
      `Space-Track TLE（模拟）同步完成：成功 ${success}, 失败 ${failed}`,
    );
  }

  private extractErrorDetails(error: any): {
    code?: string;
    detail?: string;
    hint?: string;
    column?: string;
    table?: string;
    constraint?: string;
    stack?: string;
  } {
    const pgError = error.cause || error;
    return {
      code: pgError.code,
      detail: pgError.detail,
      hint: pgError.hint,
      column: pgError.column,
      table: pgError.table,
      constraint: pgError.constraint,
      stack: error.stack,
    };
  }

  private async logSyncError(
    taskId: string,
    noradId: string,
    name: string | undefined,
    source: string,
    errorType: SyncErrorType,
    errorMessage: string,
    rawTle?: string,
    errorDetails?: {
      code?: string;
      detail?: string;
      hint?: string;
      column?: string;
      table?: string;
      constraint?: string;
      stack?: string;
    },
  ): Promise<void> {
    try {
      await this.db.insert(satelliteSyncErrorLogs).values({
        taskId: taskId,
        noradId: noradId,
        name: name || `Unknown-${noradId}`,
        source,
        errorType: errorType,
        errorMessage: errorMessage,
        rawTle: rawTle,
        errorDetails: errorDetails || undefined,
        timestamp: new Date(),
      });
    } catch (logError: any) {
      this.logger.warn(`记录错误日志失败: ${logError.message}`);
    }
  }

  private formatNoradId(id: string | number): string {
    return String(id).padStart(5, "0");
  }

  private generateTaskId(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 6);
    return `sync-${dateStr}-${random}`;
  }

  private async sleep(ms: number): Promise<void> {
    const checkInterval = 500;
    const iterations = Math.ceil(ms / checkInterval);
    for (let i = 0; i < iterations; i++) {
      this.checkStopRequested();
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }
  }

  private getRandomKeepTrackDelay(): number {
    return (
      Math.floor(
        Math.random() *
          (this.KEEPTRACK_MAX_DELAY_MS - this.KEEPTRACK_MIN_DELAY_MS + 1),
      ) + this.KEEPTRACK_MIN_DELAY_MS
    );
  }
}
