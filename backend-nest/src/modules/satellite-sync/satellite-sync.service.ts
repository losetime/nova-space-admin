import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  SatelliteSyncTaskEntity,
  SyncType,
  SyncStatus,
} from './entities/sync-task.entity';
import { SatelliteTle } from './entities/satellite-tle.entity';
import { SatelliteMetadataEntity } from './entities/satellite-metadata.entity';
import { SatelliteSyncErrorLogEntity, SyncErrorType } from './entities/sync-error-log.entity';
import { SyncProgress, SyncStatsResponse, TaskListQueryDto, TaskListResponse, SyncTaskItem, TleListQueryDto, TleListResponse, TleItem, MetadataListQueryDto, MetadataListResponse, MetadataItem, ErrorLogListResponse, ErrorLogItem } from './dto/sync.dto';

/**
 * Space-Track API 响应结构
 */
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

/**
 * ESA DISCOS API 响应结构
 */
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
      operators?: {
        data?: Array<{ type: string; id: string }>;
      };
      launch?: {
        data?: { type: string; id: string } | null;
      };
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
      vehicle?: {
        data?: { type: string; id: string };
      };
      site?: {
        data?: { type: string; id: string };
      };
    };
  }>;
}

/**
 * CelesTrak GP 响应结构
 */
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
  EPHEMERIS_TYPE?: number;
  CLASSIFICATION_TYPE?: string;
  ELEMENT_SET_NO?: number;
  REV_AT_EPOCH?: number;
  BSTAR?: number;
  MEAN_MOTION_DOT?: number;
  MEAN_MOTION_DDOT?: number;
}

/**
 * KeepTrack Brief 响应结构
 */
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

/**
 * KeepTrack 卫星详情响应结构
 */
interface KeepTrackSatDetailResponse {
  NORAD_CAT_ID: string;
  NAME: string;
  OBJECT_ID?: string;       // 国际编号，如 "1998-067A"
  ALT_NAME?: string;        // 别名
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
  LAUNCH_SITE?: string;
  LAUNCH_VEHICLE?: string;
  MISSION?: string;
  PURPOSE?: string;
  EQUIPMENT?: string;
  PAYLOAD?: string;
  ADCS?: string;
  RCS?: string;
  STATUS?: string;
  TYPE?: number;            // 对象类型：1=PAYLOAD, 2=ROCKET_BODY, 3=DEBRIS, etc.
  SHAPE?: string;           // 形状描述
  LIFETIME?: string;        // 设计寿命
  VMAG?: number;            // 视星等
  CONSTELLATION_NAME?: string;
  TLE_LINE_1?: string;
  TLE_LINE_2?: string;
  EPOCH?: string;
  INCLINATION?: number;
  RA_OF_ASC_NODE?: number;
  MEAN_MOTION?: number;     // 平均运动（用于推算轨道周期）
  ARG_OF_PERICENTER?: number;
  MEAN_ANOMALY?: number;
  DECAY_DATE?: string;
}

/**
 * 卫星同步服务
 * 处理 TLE 和 ESA DISCOS 数据同步
 */
@Injectable()
export class SatelliteSyncService {
  private readonly logger = new Logger(SatelliteSyncService.name);

  // Space-Track 配置
  private readonly spaceTrackUsername: string;
  private readonly spaceTrackPassword: string;
  private readonly spaceTrackBaseUrl = 'https://www.space-track.org';

  // ESA DISCOS 配置
  private readonly esaDiscosApiToken: string | undefined;
  private readonly esaDiscosBaseUrl = 'https://discosweb.esoc.esa.int/api';

  // CelesTrak 配置
  private readonly celestrakBaseUrl = 'https://celestrak.org/NORAD/elements';

  // KeepTrack 配置
  private readonly keepTrackApiKey: string;
  private readonly keepTrackBaseUrl = 'https://api.keeptrack.space/v4';

  // 同步状态
  private currentTask: SatelliteSyncTaskEntity | null = null;
  private sessionCookie: string = '';
  private cookieExpiry: Date | null = null;
  private useMockData: boolean = false; // 是否使用模拟数据（从本地缓存文件读取）

  // 限流参数
  private readonly BATCH_INTERVAL_MS = 3000; // 批次间隔 3 秒
  private readonly RATE_LIMIT_WAIT_MS = 60000; // 限流等待 60 秒
  private readonly DISCOS_MIN_INTERVAL_MS = 500; // DISCOS 最小请求间隔

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(SatelliteSyncTaskEntity)
    private readonly taskRepository: Repository<SatelliteSyncTaskEntity>,
    @InjectRepository(SatelliteTle)
    private readonly tleRepository: Repository<SatelliteTle>,
    @InjectRepository(SatelliteMetadataEntity)
    private readonly metadataRepository: Repository<SatelliteMetadataEntity>,
    @InjectRepository(SatelliteSyncErrorLogEntity)
    private readonly errorLogRepository: Repository<SatelliteSyncErrorLogEntity>,
  ) {
    this.spaceTrackUsername = this.configService.get<string>('app.spaceTrack.username') || '';
    this.spaceTrackPassword = this.configService.get<string>('app.spaceTrack.password') || '';
    this.esaDiscosApiToken = this.configService.get<string>('app.esaDiscos.apiToken');
    this.keepTrackApiKey = this.configService.get<string>('app.keepTrack.apiKey') || '';
    this.useMockData = this.configService.get<boolean>('app.useMockData') || false;
  }

  /**
   * 获取当前同步状态
   * 返回正在运行的任务，或最近完成的任务（5分钟内）
   */
  async getCurrentStatus(): Promise<SatelliteSyncTaskEntity | null> {
    // 优先返回内存中正在运行的任务
    if (this.currentTask) {
      return this.currentTask;
    }

    // 查找正在运行的任务
    const runningTask = await this.taskRepository.findOne({
      where: { status: 'running' },
      order: { startedAt: 'DESC' },
    });

    if (runningTask) {
      return runningTask;
    }

    // 查找最近完成的任务（5分钟内），让前端能看到结果
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentTask = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.status IN (:...statuses)', { statuses: ['completed', 'failed'] })
      .andWhere('task.completedAt > :fiveMinutesAgo', { fiveMinutesAgo })
      .orderBy('task.completedAt', 'DESC')
      .getOne();

    return recentTask || null;
  }

  /**
   * 获取数据统计
   */
  async getStats(): Promise<SyncStatsResponse> {
    const tleCount = await this.tleRepository.count();
    const metadataCount = await this.metadataRepository.count();
    const discosCount = await this.metadataRepository.count({
      where: { hasDiscosData: true },
    });

    const celestrakCount = await this.tleRepository.count({
      where: { source: 'celestrak' },
    });

    const keepTrackCount = await this.tleRepository.count({
      where: { source: 'keeptrack' },
    });

    const discosCoverage = metadataCount > 0
      ? ((discosCount / metadataCount) * 100).toFixed(1) + '%'
      : '0%';

    // 获取最近同步时间
    const lastCelestrakTask = await this.taskRepository.findOne({
      where: { type: 'celestrak', status: 'completed' },
      order: { completedAt: 'DESC' },
    });

    const lastKeepTrackTask = await this.taskRepository.findOne({
      where: { type: 'keeptrack-tle', status: 'completed' },
      order: { completedAt: 'DESC' },
    });

    const lastDiscosTask = await this.taskRepository.findOne({
      where: { type: 'discos', status: 'completed' },
      order: { completedAt: 'DESC' },
    });

    return {
      tleCount,
      metadataCount,
      discosCount,
      discosCoverage,
      celestrakCount,
      keepTrackCount,
      lastCelestrakSync: lastCelestrakTask?.completedAt?.toISOString(),
      lastKeepTrackSync: lastKeepTrackTask?.completedAt?.toISOString(),
      lastDiscosSync: lastDiscosTask?.completedAt?.toISOString(),
    };
  }

  /**
   * 获取同步任务列表
   */
  async getTaskList(query: TaskListQueryDto): Promise<TaskListResponse> {
    const { page = 1, limit = 10, status, type } = query;
    const skip = (page - 1) * limit;

    const qb = this.taskRepository.createQueryBuilder('task');

    if (status) {
      qb.andWhere('task.status = :status', { status });
    }

    if (type) {
      qb.andWhere('task.type = :type', { type });
    }

    qb.orderBy('task.startedAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [tasks, total] = await qb.getManyAndCount();

    const data: SyncTaskItem[] = tasks.map(task => ({
      id: task.id,
      type: task.type,
      status: task.status,
      total: task.total,
      processed: task.processed,
      success: task.success,
      failed: task.failed,
      startedAt: task.startedAt?.toISOString() || '',
      completedAt: task.completedAt?.toISOString(),
      error: task.error,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取任务详情
   */
  async getTaskById(taskId: string): Promise<SyncTaskItem | null> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      return null;
    }

    return {
      id: task.id,
      type: task.type,
      status: task.status,
      total: task.total,
      processed: task.processed,
      success: task.success,
      failed: task.failed,
      startedAt: task.startedAt?.toISOString() || '',
      completedAt: task.completedAt?.toISOString(),
      error: task.error,
    };
  }

  /**
   * 获取任务错误日志
   */
  async getTaskErrors(taskId: string): Promise<ErrorLogListResponse> {
    const errors = await this.errorLogRepository.find({
      where: { taskId },
      order: { timestamp: 'DESC' },
    });

    const data: ErrorLogItem[] = errors.map(err => ({
      id: err.id,
      noradId: err.noradId,
      name: err.name,
      source: err.source,
      errorType: err.errorType,
      errorMessage: err.errorMessage,
      timestamp: err.timestamp.toISOString(),
    }));

    return {
      data,
      total: errors.length,
    };
  }

  /**
   * 获取 TLE 数据列表
   */
  async getTleList(query: TleListQueryDto): Promise<TleListResponse> {
    const { page = 1, limit = 20, search, source } = query;
    const skip = (page - 1) * limit;

    const qb = this.tleRepository.createQueryBuilder('tle');

    if (search) {
      qb.andWhere(
        '(tle.name ILIKE :search OR tle.noradId ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (source) {
      qb.andWhere('tle.source = :source', { source });
    }

    qb.orderBy('tle.epoch', 'DESC')
      .skip(skip)
      .take(limit);

    const [tles, total] = await qb.getManyAndCount();

    const data: TleItem[] = tles.map(tle => ({
      noradId: tle.noradId,
      name: tle.name,
      source: tle.source,
      epoch: tle.epoch?.toISOString(),
      inclination: tle.inclination,
      raan: tle.raan,
      eccentricity: tle.eccentricity,
      line1: tle.line1,
      line2: tle.line2,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取卫星元数据列表
   */
  async getMetadataList(query: MetadataListQueryDto): Promise<MetadataListResponse> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.metadataRepository.createQueryBuilder('meta');

    if (search) {
      qb.andWhere(
        '(meta.name ILIKE :search OR meta.noradId ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('meta.noradId', 'ASC')
      .skip(skip)
      .take(limit);

    const [metas, total] = await qb.getManyAndCount();

    const data: MetadataItem[] = metas.map(meta => ({
      noradId: meta.noradId,
      name: meta.name,
      countryCode: meta.countryCode,
      launchDate: meta.launchDate,
      objectType: meta.objectType,
      status: meta.status,
      hasExtendedData: meta.hasExtendedData,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 开始同步
   */
  async startSync(type: SyncType): Promise<SatelliteSyncTaskEntity> {
    // 检查是否有运行中的任务
    const runningTask = await this.getCurrentStatus();
    // 只有真正正在运行的任务才阻止新任务
    if (runningTask && runningTask.status === 'running') {
      throw new Error('已有同步任务正在运行，请等待完成后再试');
    }

    // 创建新任务
    const taskId = this.generateTaskId();
    const task = this.taskRepository.create({
      id: taskId,
      type,
      status: 'running',
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      startedAt: new Date(),
    });

    await this.taskRepository.save(task);
    this.currentTask = task;

    // 异步执行同步
    this.executeSync(task).catch((error) => {
      this.logger.error(`同步任务失败：${error.message}`);
    });

    return task;
  }

  /**
   * 执行同步（智能降级策略）
   */
  private async executeSync(task: SatelliteSyncTaskEntity): Promise<void> {
    try {
      switch (task.type) {
        case 'celestrak':
          await this.syncCelestrak(task);
          break;
        case 'space-track':
          await this.syncTle(task);
          break;
        case 'keeptrack-tle':
          await this.syncKeepTrackBrief(task);
          break;
        case 'keeptrack-meta':
          await this.syncKeepTrackDetail(task);
          break;
        case 'discos':
          await this.syncDiscos(task);
          break;
        case 'all':
          // 智能降级策略：主数据源失败才用备用源

          // TLE 数据同步：KeepTrack（主） → Space-Track（备用） → CelesTrak（兜底）
          let tleSyncSuccess = false;

          // 优先使用 KeepTrack（主数据源，与元数据策略对齐）
          if (this.keepTrackApiKey) {
            this.logger.log('[完整同步] 开始 TLE 数据同步 - 主数据源 KeepTrack');
            try {
              await this.syncKeepTrackBrief(task);
              tleSyncSuccess = true;
              this.logger.log('[完整同步] KeepTrack TLE 同步成功，跳过备用源');
            } catch (error) {
              this.logger.warn(`[完整同步] KeepTrack TLE 失败：${error.message}，尝试 Space-Track 备用源`);
            }
          } else {
            this.logger.warn('[完整同步] KeepTrack API Key 未配置，尝试 Space-Track 备用源');
          }

          if (!tleSyncSuccess) {
            try {
              await this.syncTle(task);
              tleSyncSuccess = true;
              this.logger.log('[完整同步] Space-Track TLE 同步成功，跳过 CelesTrak');
            } catch (error) {
              this.logger.warn(`[完整同步] Space-Track 失败：${error.message}，尝试 CelesTrak 兜底源`);
            }
          }

          if (!tleSyncSuccess) {
            try {
              await this.syncCelestrak(task);
              tleSyncSuccess = true;
              this.logger.log('[完整同步] CelesTrak TLE 同步成功（兜底）');
            } catch (error) {
              this.logger.warn(`[完整同步] CelesTrak 失败：${error.message}`);
            }
          }

          if (!tleSyncSuccess) {
            this.logger.error('[完整同步] 所有 TLE 数据源均失败');
          }

          // 元数据同步：KeepTrack（主） → ESA DISCOS（备用）
          let metaSyncSuccess = false;

          if (this.keepTrackApiKey) {
            this.logger.log('[完整同步] 开始元数据同步 - 主数据源 KeepTrack');
            try {
              await this.syncKeepTrackDetail(task);
              metaSyncSuccess = true;
              this.logger.log('[完整同步] KeepTrack 元数据同步成功，跳过 ESA DISCOS');
            } catch (error) {
              this.logger.warn(`[完整同步] KeepTrack 元数据失败：${error.message}，尝试 ESA DISCOS 备用源`);
            }
          } else {
            this.logger.warn('[完整同步] KeepTrack API Key 未配置，跳过主数据源');
          }

          if (!metaSyncSuccess) {
            try {
              await this.syncDiscos(task);
              metaSyncSuccess = true;
              this.logger.log('[完整同步] ESA DISCOS 元数据同步成功');
            } catch (error) {
              this.logger.warn(`[完整同步] ESA DISCOS 失败：${error.message}`);
            }
          }

          if (!metaSyncSuccess) {
            this.logger.error('[完整同步] 所有元数据源均失败');
          }

          break;
      }

      // 更新任务状态为完成
      task.status = 'completed';
      task.completedAt = new Date();
      await this.taskRepository.save(task);
      this.logger.log(`同步任务完成: ${task.id}`);
    } catch (error) {
      this.logger.error(`同步任务失败: ${error.message}`, error.stack);
      task.status = 'failed';
      task.error = error.message;
      task.completedAt = new Date();
      await this.taskRepository.save(task);
    } finally {
      this.currentTask = null;
    }
  }

  /**
   * CelesTrak TLE 数据同步（兜底数据源）
   */
  private async syncCelestrak(task: SatelliteSyncTaskEntity): Promise<void> {
    this.logger.log('开始 CelesTrak TLE 数据同步（兜底源）...');

    // 如果使用模拟数据，从本地缓存文件读取
    if (this.useMockData) {
      await this.syncCelestrakMock(task);
      return;
    }

    const url = `${this.celestrakBaseUrl}/gp.php?GROUP=active&FORMAT=json`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Nova-Space-Admin/1.0' },
      });

      if (!response.ok) {
        throw new Error(`CelesTrak API 错误：${response.status}`);
      }

      const data: CelestrakGpResponse[] = await response.json();
      this.logger.log(`获取 ${data.length} 条 CelesTrak 数据`);

      task.total = data.length;
      await this.taskRepository.save(task);

      let success = 0;
      let skipped = 0;
      for (const item of data) {
        try {
          const noradId = this.formatNoradId(item.NORAD_CAT_ID);

          // 检查是否已存在数据（避免覆盖其他源的 richer 数据）
          const existing = await this.tleRepository.findOne({
            where: { noradId },
            select: ['source'],
          });

          if (existing) {
            // 已有其他源的数据，跳过不覆盖
            skipped++;
            continue;
          }

          await this.tleRepository.upsert({
            noradId,
            name: item.OBJECT_NAME,
            source: 'celestrak',
            epoch: new Date(item.EPOCH),
            inclination: item.INCLINATION,
            raan: item.RA_OF_ASC_NODE,
            eccentricity: item.ECCENTRICITY,
            argOfPerigee: item.ARG_OF_PERICENTER,
            meanMotion: item.MEAN_MOTION,
          }, ['noradId']);

          success++;
        } catch (error) {
          this.logger.warn(`保存失败 (${item.OBJECT_NAME}): ${error.message}`);
        }
      }

      task.success = success;
      task.processed = data.length;
      await this.taskRepository.save(task);

      this.logger.log(`CelesTrak 同步完成：成功 ${success}, 跳过 ${skipped} (已有其他源数据)`);
    } catch (error) {
      this.logger.error(`CelesTrak 同步失败：${error.message}`);
      throw error;
    }
  }

  /**
   * CelesTrak TLE 数据同步（模拟模式 - 从本地缓存文件读取）
   */
  private async syncCelestrakMock(task: SatelliteSyncTaskEntity): Promise<void> {
    this.logger.log('开始 CelesTrak TLE 数据同步（模拟模式）...');

    const cacheFilePath = require('path').join(
      process.cwd(),
      'data',
      'celestrak-tle-cache.json',
    );

    const fs = await import('fs');

    if (!fs.existsSync(cacheFilePath)) {
      throw new Error(`模拟数据文件不存在：${cacheFilePath}，请先运行 pnpm run cache:tle`);
    }

    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
    this.logger.log(`从缓存文件读取到 ${cacheData.count} 条数据`);

    if (cacheData.count === 0) {
      this.logger.warn('CelesTrak 缓存数据为空，跳过同步');
      task.status = 'completed';
      task.completedAt = new Date();
      await this.taskRepository.save(task);
      return;
    }

    task.total = cacheData.count;
    await this.taskRepository.save(task);

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of cacheData.data) {
      const noradId = this.formatNoradId(item.NORAD_CAT_ID);

      // 检查是否缺少 name 字段
      if (!item.OBJECT_NAME) {
        failed++;
        await this.logSyncError(
          task.id,
          noradId,
          undefined,
          'celestrak',
          'missing_name',
          '卫星数据缺少 OBJECT_NAME 字段',
          undefined,
        );
        continue;
      }

      try {
        // 先创建基础元数据记录（如果不存在）
        await this.metadataRepository
          .createQueryBuilder()
          .insert()
          .values({ noradId, hasDiscosData: false, hasExtendedData: false })
          .onConflict('("noradId") DO NOTHING')
          .execute();

        // 检查是否已存在数据（避免覆盖其他源的 richer 数据）
        const existing = await this.tleRepository.findOne({
          where: { noradId },
          select: ['source'],
        });

        if (existing) {
          // 已有其他源的数据，记录为 duplicate
          skipped++;
          await this.logSyncError(
            task.id,
            noradId,
            item.OBJECT_NAME,
            'celestrak',
            'duplicate',
            `已有 ${existing.source} 数据源的数据，跳过覆盖`,
            undefined,
          );
          continue;
        }

        await this.tleRepository.upsert({
          noradId,
          name: item.OBJECT_NAME,
          source: 'celestrak',
          epoch: item.EPOCH ? new Date(item.EPOCH) : undefined,
          inclination: item.INCLINATION ? parseFloat(item.INCLINATION) : undefined,
          raan: item.RA_OF_ASC_NODE ? parseFloat(item.RA_OF_ASC_NODE) : undefined,
          eccentricity: item.ECCENTRICITY ? parseFloat(item.ECCENTRICITY) : undefined,
          argOfPerigee: item.ARG_OF_PERICENTER ? parseFloat(item.ARG_OF_PERICENTER) : undefined,
          meanMotion: item.MEAN_MOTION ? parseFloat(item.MEAN_MOTION) : undefined,
        }, ['noradId']);

        success++;
      } catch (dbError: any) {
        failed++;
        await this.logSyncError(
          task.id,
          noradId,
          item.OBJECT_NAME,
          'celestrak',
          'database',
          dbError.message,
          undefined,
        );
      }

      task.processed = success + skipped + failed;
      task.success = success;
      task.failed = failed;
      await this.taskRepository.save(task);
    }

    task.status = 'completed';
    task.completedAt = new Date();
    await this.taskRepository.save(task);

    this.logger.log(`CelesTrak（模拟）同步完成：成功 ${success}, 跳过 ${skipped}, 失败 ${failed}`);
  }

  /**
   * TLE 数据同步（Space-Track）
   */
  private async syncTle(task: SatelliteSyncTaskEntity): Promise<void> {
    this.logger.log('开始 Space-Track TLE 数据同步...');

    // 如果使用模拟数据，从本地缓存文件读取
    if (this.useMockData) {
      await this.syncTleMock(task);
      return;
    }

    if (!this.spaceTrackUsername || !this.spaceTrackPassword) {
      throw new Error('Space-Track 凭据未配置，请检查环境变量');
    }

    // 登录获取 session
    this.logger.log('正在登录 Space-Track...');
    await this.loginSpaceTrack();
    this.logger.log('Space-Track 登录成功');

    // 分批获取数据
    const batches = [
      { range: '1--9999', name: '早期卫星' },
      { range: '10000--19999', name: '1980s-1990s' },
      { range: '20000--29999', name: '1990s-2000s' },
      { range: '30000--39999', name: '2000s-2010s' },
      { range: '40000--49999', name: '2010s-2020s' },
      { range: '50000--99999', name: '2020s 至今' },
    ];

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    let batchErrors: string[] = [];

    for (const batch of batches) {
      this.logger.log(`获取批次：${batch.name} (NORAD ID ${batch.range})`);

      try {
        const gpData = await this.fetchGpBatch(batch.range);
        this.logger.log(`批次 ${batch.name} 获取到 ${gpData.length} 条数据`);

        // 处理数据
        const result = await this.processAndStoreGpData(gpData);
        totalProcessed += gpData.length;
        totalSuccess += result.success;
        totalFailed += result.failed;

        this.logger.log(`批次 ${batch.name} 处理完成：成功 ${result.success}, 失败 ${result.failed}`);

        // 更新任务进度
        task.total = totalProcessed;
        task.processed = totalProcessed;
        task.success = totalSuccess;
        task.failed = totalFailed;
        await this.taskRepository.save(task);

        // 批次间隔
        await this.sleep(this.BATCH_INTERVAL_MS);
      } catch (error) {
        this.logger.error(`批次 ${batch.name} 失败：${error.message}`);
        batchErrors.push(`${batch.name}: ${error.message}`);
      }
    }

    this.logger.log(`Space-Track TLE 同步完成：成功 ${totalSuccess}, 失败 ${totalFailed}`);

    // 如果所有批次都失败，抛出异常触发兜底源
    if (totalSuccess === 0 && batchErrors.length > 0) {
      throw new Error(`Space-Track 所有批次均失败：${batchErrors.join('; ')}`);
    }

    // 部分成功也记录警告
    if (totalFailed > 0 && totalSuccess > 0) {
      this.logger.warn(`Space-Track 部分失败：${totalFailed} 条数据处理失败`);
    }
  }

  /**
   * 登录 Space-Track
   */
  private async loginSpaceTrack(): Promise<void> {
    const https = await import('https');
    const url = `${this.spaceTrackBaseUrl}/ajaxauth/login`;

    this.logger.log('正在登录 Space-Track...');

    return new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Nova-Space-Admin/1.0',
          },
          timeout: 60000,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            if (res.statusCode !== 200) {
              reject(new Error(`登录失败，状态码：${res.statusCode}`));
              return;
            }
            const cookies = res.headers['set-cookie'];
            if (cookies) {
              this.sessionCookie = cookies.map((c) => c.split(';')[0]).join('; ');
              this.cookieExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);
              this.logger.log('Space-Track 登录成功');
              resolve();
            } else {
              reject(new Error('未获取到 session cookie'));
            }
          });
        },
      );

      req.on('error', (err) => {
        this.logger.error(`Space-Track 登录网络错误: ${err.message}`);
        reject(err);
      });
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('登录超时'));
      });

      req.write(`identity=${encodeURIComponent(this.spaceTrackUsername)}&password=${encodeURIComponent(this.spaceTrackPassword)}`);
      req.end();
    });
  }

  /**
   * 获取 GP 数据批次
   */
  private async fetchGpBatch(noradRange: string): Promise<SpaceTrackGpResponse[]> {
    const https = await import('https');
    const url = `${this.spaceTrackBaseUrl}/basicspacedata/query/class/gp/OBJECT_TYPE/PAYLOAD/decay_date/null-val/epoch/%3Enow-10/NORAD_CAT_ID/${noradRange}/format/json`;

    this.logger.debug(`请求：${url}`);

    return new Promise((resolve, reject) => {
      const req = https.get(
        url,
        {
          headers: {
            Cookie: this.sessionCookie,
            'User-Agent': 'Nova-Space-Admin/1.0',
          },
          timeout: 180000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              if (data.startsWith('<') || data.startsWith('Invalid')) {
                reject(new Error(`API 错误：${data.substring(0, 50)}`));
                return;
              }
              const items: SpaceTrackGpResponse[] = JSON.parse(data);
              this.logger.log(`获取 ${items.length} 条数据`);
              resolve(items);
            } catch (error) {
              reject(error);
            }
          });
        },
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
    });
  }

  /**
   * 处理并存储 GP 数据（Space-Track）
   */
  private async processAndStoreGpData(gpData: SpaceTrackGpResponse[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const item of gpData) {
      try {
        const noradId = this.formatNoradId(item.NORAD_CAT_ID);

        // 保存 TLE（Space-Track 数据）
        const tleEntity = this.tleRepository.create({
          noradId,
          name: item.OBJECT_NAME,
          source: 'space-track',
          line1: item.TLE_LINE1,
          line2: item.TLE_LINE2,
          epoch: item.EPOCH ? new Date(item.EPOCH) : undefined,
          inclination: item.INCLINATION ? parseFloat(item.INCLINATION) : undefined,
          raan: item.RA_OF_ASC_NODE ? parseFloat(item.RA_OF_ASC_NODE) : undefined,
          eccentricity: item.ECCENTRICITY ? parseFloat(item.ECCENTRICITY) : undefined,
          argOfPerigee: item.ARG_OF_PERICENTER ? parseFloat(item.ARG_OF_PERICENTER) : undefined,
          meanMotion: item.MEAN_MOTION ? parseFloat(item.MEAN_MOTION) : undefined,
        });

        await this.tleRepository.save(tleEntity);

        // 更新或创建元数据
        await this.upsertMetadata(item);
        success++;
      } catch (error) {
        this.logger.warn(`保存 Space-Track 数据失败 (${item.OBJECT_NAME}, NORAD ${item.NORAD_CAT_ID}): ${error.message}`);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * 更新或创建元数据
   */
  private async upsertMetadata(item: SpaceTrackGpResponse): Promise<void> {
    const noradId = this.formatNoradId(item.NORAD_CAT_ID);

    const existing = await this.metadataRepository.findOne({
      where: { noradId },
    });

    const metadataUpdate: Partial<SatelliteMetadataEntity> = {
      name: item.OBJECT_NAME,
      objectId: item.OBJECT_ID,
      countryCode: item.COUNTRY_CODE,
      launchDate: item.LAUNCH_DATE,
      launchSite: item.SITE,
      objectType: item.OBJECT_TYPE,
      rcs: item.RCS_SIZE,
      decayDate: item.DECAY_DATE || undefined,
      period: item.PERIOD ? parseFloat(item.PERIOD) : undefined,
      inclination: item.INCLINATION ? parseFloat(item.INCLINATION) : undefined,
      eccentricity: item.ECCENTRICITY ? parseFloat(item.ECCENTRICITY) : undefined,
      raan: item.RA_OF_ASC_NODE ? parseFloat(item.RA_OF_ASC_NODE) : undefined,
      argOfPerigee: item.ARG_OF_PERICENTER ? parseFloat(item.ARG_OF_PERICENTER) : undefined,
      apogee: item.APOAPSIS ? parseFloat(item.APOAPSIS) : undefined,
      perigee: item.PERIAPSIS ? parseFloat(item.PERIAPSIS) : undefined,
    };

    if (item.EPOCH) {
      const epochDate = new Date(item.EPOCH);
      metadataUpdate.tleEpoch = epochDate;
      const ageMs = Date.now() - epochDate.getTime();
      metadataUpdate.tleAge = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    }

    if (existing) {
      await this.metadataRepository.update(noradId, metadataUpdate);
    } else {
      const entity = this.metadataRepository.create({
        noradId,
        ...metadataUpdate,
        hasDiscosData: false,
      });
      await this.metadataRepository.save(entity);
    }
  }

  /**
   * KeepTrack TLE 数据同步（简要模式）
   */
  private async syncKeepTrackBrief(task: SatelliteSyncTaskEntity): Promise<void> {
    this.logger.log('开始 KeepTrack TLE 数据同步...');

    // 如果使用模拟数据，从本地缓存文件读取
    if (this.useMockData) {
      await this.syncKeepTrackBriefMock(task);
      return;
    }

    if (!this.keepTrackApiKey) {
      this.logger.warn('KeepTrack API Key 未配置，跳过 KeepTrack 同步');
      task.status = 'completed';
      task.completedAt = new Date();
      await this.taskRepository.save(task);
      return;
    }

    const url = `${this.keepTrackBaseUrl}/sats/brief`;

    try {
      const response = await fetch(url, {
        headers: { 'X-API-Key': this.keepTrackApiKey },
      });

      if (!response.ok) {
        throw new Error(`KeepTrack API 错误：${response.status}`);
      }

      const data: KeepTrackBriefResponse[] = await response.json();
      this.logger.log(`获取 ${data.length} 条 KeepTrack 数据`);

      task.total = data.length;
      await this.taskRepository.save(task);

      let success = 0;
      for (const sat of data) {
        try {
          const noradId = this.extractNoradId(sat.tle1);

          await this.tleRepository.upsert({
            noradId,
            name: sat.name,
            source: 'keeptrack',
            line1: sat.tle1,
            line2: sat.tle2,
          }, ['noradId']);

          success++;
        } catch (error) {
          this.logger.warn(`保存失败 (${sat.name}): ${error.message}`);
        }

        // 限流：1000 次/小时
        await this.sleep(3600);
      }

      task.success = success;
      task.processed = data.length;
      await this.taskRepository.save(task);

      this.logger.log(`KeepTrack TLE 同步完成：成功 ${success}`);
    } catch (error) {
      this.logger.error(`KeepTrack TLE 同步失败：${error.message}`);
      throw error;
    }
  }

  /**
   * KeepTrack 元数据同步（详情模式）
   */
  private async syncKeepTrackDetail(task: SatelliteSyncTaskEntity): Promise<void> {
    this.logger.log('开始 KeepTrack 元数据同步...');

    if (!this.keepTrackApiKey) {
      this.logger.warn('KeepTrack API Key 未配置，跳过元数据同步');
      task.status = 'completed';
      task.completedAt = new Date();
      await this.taskRepository.save(task);
      return;
    }

    // 获取所有没有扩展数据的卫星
    const satellites = await this.metadataRepository
      .createQueryBuilder('m')
      .select(['m.noradId'])
      .where('m.hasExtendedData = :val', { val: false })
      .limit(1000)
      .getMany();

    if (satellites.length === 0) {
      this.logger.log('没有需要同步元数据的卫星');
      task.total = 0;
      task.processed = 0;
      task.success = 0;
      await this.taskRepository.save(task);
      return;
    }

    task.total = satellites.length;
    await this.taskRepository.save(task);

    this.logger.log(`需要同步 ${satellites.length} 颗卫星的 KeepTrack 元数据`);

    let success = 0;
    let processed = 0;

    for (const sat of satellites) {
      try {
        const url = `${this.keepTrackBaseUrl}/sat/${sat.noradId}`;
        const response = await fetch(url, {
          headers: { 'X-API-Key': this.keepTrackApiKey },
        });

        if (response.ok) {
          const detail: KeepTrackSatDetailResponse = await response.json();
          await this.saveKeepTrackMetadata(sat.noradId, detail);
          success++;
        }

        // 限流：1000 次/小时
        await this.sleep(3600);
      } catch (error) {
        this.logger.warn(`获取元数据失败 (${sat.noradId}): ${error.message}`);
      }

      processed++;
      task.processed = processed;
      task.success = success;
      await this.taskRepository.save(task);
    }

    this.logger.log(`KeepTrack 元数据同步完成：成功 ${success}/${processed}`);
  }

  /**
   * 从 TLE 提取 NORAD ID
   */
  private extractNoradId(tle1: string): string {
    const match = tle1.match(/^1\s+(\d+)/);
    if (match) {
      return match[1].padStart(5, '0');
    }
    throw new Error(`无法从 TLE 提取 NORAD ID: ${tle1}`);
  }

  /**
   * 保存 KeepTrack 元数据
   */
  private async saveKeepTrackMetadata(
    noradId: string,
    detail: KeepTrackSatDetailResponse
  ): Promise<void> {
    // 将 TYPE 数字转换为字符串
    const objectTypeMap: Record<number, string> = {
      1: 'PAYLOAD',
      2: 'ROCKET_BODY',
      3: 'DEBRIS',
      4: 'UNKNOWN',
      5: 'SPECIAL',
    };

    // 从 MEAN_MOTION 推算轨道周期（分钟）
    // 公式：period = 1440 / mean_motion（分钟）
    let period: number | undefined;
    if (detail.MEAN_MOTION && detail.MEAN_MOTION > 0) {
      period = 1440 / detail.MEAN_MOTION;
    }

    // 将 ALT_NAME 转换为数组格式
    let altNames: string[] | undefined;
    if (detail.ALT_NAME) {
      // 如果有多个别名，用逗号或分号分隔
      altNames = detail.ALT_NAME.split(/[;,]/).map(s => s.trim()).filter(s => s.length > 0);
      if (altNames.length === 0) {
        altNames = undefined;
      }
    }

    const updateData: Partial<SatelliteMetadataEntity> = {
      name: detail.NAME,
      objectId: detail.OBJECT_ID,
      altNames,
      countryCode: detail.COUNTRY,
      objectType: detail.TYPE ? objectTypeMap[detail.TYPE] || `TYPE_${detail.TYPE}` : undefined,
      operator: detail.OWNER,
      contractor: detail.MANUFACTURER,
      bus: detail.BUS,
      shape: detail.SHAPE,
      lifetime: detail.LIFETIME,
      stdMag: detail.VMAG,
      launchDate: detail.LAUNCH_DATE,
      launchSite: detail.LAUNCH_SITE,
      launchVehicle: detail.LAUNCH_VEHICLE,
      mission: detail.MISSION,
      purpose: detail.PURPOSE,
      length: detail.LENGTH ? parseFloat(detail.LENGTH) : undefined,
      diameter: detail.DIAMETER ? parseFloat(detail.DIAMETER) : undefined,
      span: detail.SPAN ? parseFloat(detail.SPAN) : undefined,
      dryMass: detail.DRY_MASS ? parseFloat(detail.DRY_MASS) : undefined,
      launchMass: detail.LAUNCH_MASS ? parseFloat(detail.LAUNCH_MASS) : undefined,
      equipment: detail.EQUIPMENT,
      adcs: detail.ADCS,
      payload: detail.PAYLOAD,
      constellationName: detail.CONSTELLATION_NAME,
      // 轨道参数
      period,
      inclination: detail.INCLINATION,
      raan: detail.RA_OF_ASC_NODE,
      argOfPerigee: detail.ARG_OF_PERICENTER,
      rcs: detail.RCS,
      tleEpoch: detail.EPOCH ? new Date(detail.EPOCH) : undefined,
      tleAge: detail.EPOCH ? Math.floor((Date.now() - new Date(detail.EPOCH).getTime()) / (1000 * 60 * 60 * 24)) : undefined,
      decayDate: detail.DECAY_DATE || undefined,
      status: detail.STATUS,
      hasExtendedData: true,
    };

    await this.metadataRepository.update(noradId, updateData);
  }

  /**
   * ESA DISCOS 批量同步（备用数据源）
   * 使用批量查询优化，每次查询最多 100 个 noradId
   */
  private async syncDiscos(task: SatelliteSyncTaskEntity): Promise<void> {
    this.logger.log('开始 ESA DISCOS 数据同步...');

    if (!this.esaDiscosApiToken) {
      throw new Error('ESA DISCOS API Token 未配置');
    }

    // 获取所有需要同步的卫星
    const metadataList = await this.metadataRepository.find({
      where: { hasDiscosData: false },
      select: ['noradId'],
    });

    task.total = metadataList.length;
    await this.taskRepository.save(task);

    this.logger.log(`需要同步 ${metadataList.length} 颗卫星的 DISCOS 数据`);

    // 批量处理，每批 100 个
    const BATCH_SIZE = 100;
    let processed = 0;
    let success = 0;
    let failed = 0;

    for (let i = 0; i < metadataList.length; i += BATCH_SIZE) {
      const batch = metadataList.slice(i, i + BATCH_SIZE);
      const noradIds = batch.map(m => m.noradId);

      try {
        // 批量查询
        const discosDataMap = await this.fetchDiscosDataBatch(noradIds);

        // 更新每条数据
        for (const meta of batch) {
          const discosInfo = discosDataMap.get(meta.noradId);
          if (discosInfo) {
            await this.updateMetadataWithDiscos(meta.noradId, discosInfo);
            success++;
          } else {
            // 没有找到数据，标记为已处理
            await this.metadataRepository.update(meta.noradId, { hasDiscosData: true });
            success++;
          }
          processed++;
        }
      } catch (error) {
        this.logger.warn(`批量获取 DISCOS 数据失败: ${error.message}`);
        // 批量失败时，逐个重试
        for (const meta of batch) {
          try {
            const discosInfo = await this.fetchDiscosData(meta.noradId);
            if (discosInfo) {
              await this.updateMetadataWithDiscos(meta.noradId, discosInfo);
              success++;
            } else {
              await this.metadataRepository.update(meta.noradId, { hasDiscosData: true });
              success++;
            }
          } catch (e) {
            this.logger.warn(`获取 DISCOS 数据失败 (${meta.noradId}): ${e.message}`);
            failed++;
          }
          processed++;
        }
      }

      // 更新进度
      task.processed = processed;
      task.success = success;
      task.failed = failed;
      await this.taskRepository.save(task);

      // 限流：每批间隔
      await this.sleep(this.BATCH_INTERVAL_MS);
    }

    this.logger.log(`ESA DISCOS 同步完成：成功 ${success}, 失败 ${failed}`);
  }

  /**
   * 批量从 ESA DISCOS 获取卫星数据（最多 100 个）
   */
  private async fetchDiscosDataBatch(noradIds: string[]): Promise<Map<string, any>> {
    const numericIds = noradIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const url = `${this.esaDiscosBaseUrl}/objects?filter=satno=in=(${numericIds.join(',')})&include=operators,launch,launch.vehicle,launch.site&page[size]=${numericIds.length}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.esaDiscosApiToken}`,
        Accept: 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        await this.sleep(parseInt(retryAfter) * 1000);
        return this.fetchDiscosDataBatch(noradIds); // 重试
      }
      throw new Error(`ESA DISCOS API 错误: ${response.status}`);
    }

    const json: DiscosResponse = await response.json();
    const result = new Map<string, any>();

    if (!json.data || json.data.length === 0) {
      return result;
    }

    const included = json.included || [];

    for (const item of json.data) {
      const attrs = item.attributes;
      const noradId = String(attrs.satno).padStart(5, '0');

      // 解析运营商
      let operator: string | undefined;
      if (item.relationships?.operators?.data?.length) {
        const operatorId = item.relationships.operators.data[0]?.id;
        if (operatorId) {
          const operatorData = included.find(
            (inc) => inc.type === 'organisation' && inc.id === operatorId,
          );
          operator = operatorData?.attributes?.name;
        }
      }

      // 解析发射信息
      let launchVehicle: string | undefined;
      let launchSiteName: string | undefined;

      if (item.relationships?.launch?.data) {
        const launchId = item.relationships.launch.data.id;
        const launchData = included.find(
          (inc) => inc.type === 'launch' && inc.id === launchId,
        );

        if (launchData) {
          if (launchData.relationships?.vehicle?.data) {
            const vehicleId = launchData.relationships.vehicle.data.id;
            const vehicleData = included.find(
              (inc) => inc.type === 'vehicle' && inc.id === vehicleId,
            );
            launchVehicle = vehicleData?.attributes?.name;
          }

          if (launchData.relationships?.site?.data) {
            const siteId = launchData.relationships.site.data.id;
            const siteData = included.find(
              (inc) => inc.type === 'launchSite' && inc.id === siteId,
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

  /**
   * 从 ESA DISCOS 获取卫星数据
   */
  private async fetchDiscosData(noradId: string): Promise<any> {
    const numericId = parseInt(noradId, 10);
    const url = `${this.esaDiscosBaseUrl}/objects?filter=satno=${numericId}&include=operators,launch,launch.vehicle,launch.site`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.esaDiscosApiToken}`,
        Accept: 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        await this.sleep(parseInt(retryAfter) * 1000);
        return this.fetchDiscosData(noradId); // 重试
      }
      return null;
    }

    const json: DiscosResponse = await response.json();

    if (!json.data || json.data.length === 0) {
      return null;
    }

    const item = json.data[0];
    const attrs = item.attributes;
    const included = json.included || [];

    // 解析运营商
    let operator: string | undefined;
    if (item.relationships?.operators?.data?.length) {
      const operatorId = item.relationships.operators.data[0]?.id;
      if (operatorId) {
        const operatorData = included.find(
          (inc) => inc.type === 'organisation' && inc.id === operatorId,
        );
        operator = operatorData?.attributes?.name;
      }
    }

    // 解析发射信息
    let launchVehicle: string | undefined;
    let launchSiteName: string | undefined;

    if (item.relationships?.launch?.data) {
      const launchId = item.relationships.launch.data.id;
      const launchData = included.find(
        (inc) => inc.type === 'launch' && inc.id === launchId,
      );

      if (launchData) {
        if (launchData.relationships?.vehicle?.data) {
          const vehicleId = launchData.relationships.vehicle.data.id;
          const vehicleData = included.find(
            (inc) => inc.type === 'vehicle' && inc.id === vehicleId,
          );
          launchVehicle = vehicleData?.attributes?.name;
        }

        if (launchData.relationships?.site?.data) {
          const siteId = launchData.relationships.site.data.id;
          const siteData = included.find(
            (inc) => inc.type === 'launchSite' && inc.id === siteId,
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

  /**
   * 更新元数据添加 DISCOS 信息
   */
  private async updateMetadataWithDiscos(noradId: string, info: any): Promise<void> {
    const dimensions = this.formatDimensions(info);

    const updateData: Partial<SatelliteMetadataEntity> = {
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
    };

    if (info.launchVehicle) {
      updateData.launchVehicle = info.launchVehicle;
    }
    if (info.launchSiteName) {
      updateData.launchSiteName = info.launchSiteName;
    }

    await this.metadataRepository.update(noradId, updateData);
  }

  /**
   * 格式化尺寸
   */
  private formatDimensions(info: any): string | undefined {
    if (!info.width && !info.height && !info.depth) {
      return undefined;
    }
    const parts: string[] = [];
    if (info.width) parts.push(`${info.width}m`);
    if (info.height) parts.push(`${info.height}m`);
    if (info.depth) parts.push(`${info.depth}m`);
    return parts.length > 0 ? parts.join(' × ') : undefined;
  }

  /**
   * 处理限流
   */
  private async handleRateLimit(): Promise<void> {
    await this.sleep(this.DISCOS_MIN_INTERVAL_MS);
  }

  /**
   * 格式化 NORAD ID
   */
  private formatNoradId(id: string | number): string {
    return String(id).padStart(5, '0');
  }

  /**
   * 生成任务 ID
   */
  private generateTaskId(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6);
    return `sync-${dateStr}-${random}`;
  }

  /**
   * 休眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Space-Track TLE 数据同步（模拟模式 - 从本地缓存文件读取）
   */
  private async syncTleMock(task: SatelliteSyncTaskEntity): Promise<void> {
    this.logger.log('开始 Space-Track TLE 数据同步（模拟模式）...');

    const cacheFilePath = require('path').join(
      process.cwd(),
      'data',
      'space-track-tle-cache.json',
    );

    const fs = await import('fs');

    if (!fs.existsSync(cacheFilePath)) {
      throw new Error(`模拟数据文件不存在：${cacheFilePath}，请先运行 pnpm run cache:tle`);
    }

    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
    this.logger.log(`从缓存文件读取到 ${cacheData.count} 条数据`);

    task.total = cacheData.count;
    await this.taskRepository.save(task);

    let success = 0;
    let failed = 0;

    for (const item of cacheData.data) {
      const noradId = this.formatNoradId(item.NORAD_CAT_ID);
      const rawTle = item.TLE_LINE1 && item.TLE_LINE2 ? `${item.TLE_LINE1}\n${item.TLE_LINE2}` : undefined;

      // 检查是否缺少 name 字段
      if (!item.OBJECT_NAME) {
        failed++;
        await this.logSyncError(
          task.id,
          noradId,
          undefined,
          'space-track',
          'missing_name',
          '卫星数据缺少 OBJECT_NAME 字段',
          rawTle,
        );
        continue;
      }

      try {
        // 先创建基础元数据记录（如果不存在）
        await this.metadataRepository
          .createQueryBuilder()
          .insert()
          .values({ noradId, hasDiscosData: false, hasExtendedData: false })
          .onConflict('("noradId") DO NOTHING')
          .execute();

        // 保存 TLE（Space-Track 数据）
        await this.tleRepository.upsert({
          noradId,
          name: item.OBJECT_NAME,
          source: 'space-track',
          line1: item.TLE_LINE1,
          line2: item.TLE_LINE2,
          epoch: item.EPOCH ? new Date(item.EPOCH) : undefined,
          inclination: item.INCLINATION ? parseFloat(item.INCLINATION) : undefined,
          raan: item.RA_OF_ASC_NODE ? parseFloat(item.RA_OF_ASC_NODE) : undefined,
          eccentricity: item.ECCENTRICITY ? parseFloat(item.ECCENTRICITY) : undefined,
          argOfPerigee: item.ARG_OF_PERICENTER ? parseFloat(item.ARG_OF_PERICENTER) : undefined,
          meanMotion: item.MEAN_MOTION ? parseFloat(item.MEAN_MOTION) : undefined,
        }, ['noradId']);

        success++;
      } catch (dbError: any) {
        failed++;
        await this.logSyncError(
          task.id,
          noradId,
          item.OBJECT_NAME,
          'space-track',
          'database',
          dbError.message,
          rawTle,
        );
      }

      task.processed = success + failed;
      task.success = success;
      task.failed = failed;
      await this.taskRepository.save(task);
    }

    task.status = 'completed';
    task.completedAt = new Date();
    await this.taskRepository.save(task);

    this.logger.log(`Space-Track TLE（模拟）同步完成：成功 ${success}, 失败 ${failed}`);
  }

  /**
   * KeepTrack TLE 数据同步（模拟模式 - 从本地缓存文件读取）
   */
  private async syncKeepTrackBriefMock(task: SatelliteSyncTaskEntity): Promise<void> {
    this.logger.log('开始 KeepTrack TLE 数据同步（模拟模式）...');

    const cacheFilePath = require('path').join(
      process.cwd(),
      'data',
      'keeptrack-tle-cache.json',
    );

    const fs = await import('fs');

    if (!fs.existsSync(cacheFilePath)) {
      throw new Error(`模拟数据文件不存在：${cacheFilePath}，请先拉取 KeepTrack 数据`);
    }

    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
    this.logger.log(`从缓存文件读取到 ${cacheData.count} 条数据`);

    if (cacheData.count === 0) {
      this.logger.warn('KeepTrack 缓存数据为空，跳过同步');
      task.status = 'completed';
      task.completedAt = new Date();
      await this.taskRepository.save(task);
      return;
    }

    task.total = cacheData.count;
    await this.taskRepository.save(task);

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const sat of cacheData.data) {
      let noradId: string;
      const rawTle = `${sat.tle1}\n${sat.tle2}`;

      // 只保留有 status 字段的数据
      if (!sat.status) {
        skipped++;
        continue;
      }

      // 尝试提取 NORAD ID
      try {
        noradId = this.extractNoradId(sat.tle1);
      } catch (parseError: any) {
        // TLE 解析失败
        failed++;
        await this.logSyncError(
          task.id,
          'UNKNOWN',
          sat.name,
          'keeptrack',
          'parse_error',
          parseError.message,
          rawTle,
        );
        continue;
      }

      // 检查是否缺少 name 字段
      if (!sat.name) {
        failed++;
        await this.logSyncError(
          task.id,
          noradId,
          undefined,
          'keeptrack',
          'missing_name',
          '卫星数据缺少 name 字段',
          rawTle,
        );
        continue;
      }

      try {
        // 先创建基础元数据记录（如果不存在），这样即使 TLE 被跳过也能有元数据记录
        await this.metadataRepository
          .createQueryBuilder()
          .insert()
          .values({ noradId, hasDiscosData: false, hasExtendedData: false })
          .onConflict('("noradId") DO NOTHING')
          .execute();

        // 检查是否已存在数据（避免覆盖其他源的 richer 数据）
        const existing = await this.tleRepository.findOne({
          where: { noradId },
          select: ['source'],
        });

        if (existing) {
          // 已有其他源的数据，记录为 duplicate（不覆盖）
          skipped++;
          await this.logSyncError(
            task.id,
            noradId,
            sat.name,
            'keeptrack',
            'duplicate',
            `已有 ${existing.source} 数据源的数据，跳过覆盖`,
            rawTle,
          );
          continue;
        }

        await this.tleRepository.upsert({
          noradId,
          name: sat.name,
          source: 'keeptrack',
          line1: sat.tle1,
          line2: sat.tle2,
        }, ['noradId']);

        success++;
      } catch (dbError: any) {
        // 数据库保存失败
        failed++;
        await this.logSyncError(
          task.id,
          noradId,
          sat.name,
          'keeptrack',
          'database',
          dbError.message,
          rawTle,
        );
      }

      // 更新进度（每100条更新一次）
      if ((success + skipped + failed) % 100 === 0) {
        task.processed = success + skipped + failed;
        task.success = success;
        task.failed = failed;
        await this.taskRepository.save(task);
      }
    }

    task.processed = success + skipped + failed;
    task.success = success;
    task.failed = failed;
    task.status = 'completed';
    task.completedAt = new Date();
    await this.taskRepository.save(task);

    this.logger.log(`KeepTrack TLE（模拟）同步完成：成功 ${success}, 跳过 ${skipped}, 失败 ${failed}`);
  }

  /**
   * 记录同步错误日志
   */
  private async logSyncError(
    taskId: string,
    noradId: string,
    name: string | undefined,
    source: string,
    errorType: SyncErrorType,
    errorMessage: string,
    rawTle?: string,
  ): Promise<void> {
    try {
      await this.errorLogRepository.save({
        taskId,
        noradId,
        name: name || `Unknown-${noradId}`,
        source,
        errorType,
        errorMessage,
        rawTle,
        timestamp: new Date(),
      });
    } catch (logError: any) {
      this.logger.warn(`记录错误日志失败: ${logError.message}`);
    }
  }
}
