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
import { SyncProgress, SyncStatsResponse } from './dto/sync.dto';

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

  // 同步状态
  private currentTask: SatelliteSyncTaskEntity | null = null;
  private sessionCookie: string = '';
  private cookieExpiry: Date | null = null;

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
  ) {
    this.spaceTrackUsername = this.configService.get<string>('app.spaceTrack.username') || '';
    this.spaceTrackPassword = this.configService.get<string>('app.spaceTrack.password') || '';
    this.esaDiscosApiToken = this.configService.get<string>('app.esaDiscos.apiToken');
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

    const discosCoverage = metadataCount > 0
      ? ((discosCount / metadataCount) * 100).toFixed(1) + '%'
      : '0%';

    // 获取最近同步时间
    const lastTleTask = await this.taskRepository.findOne({
      where: { type: 'tle', status: 'completed' },
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
      lastTleSync: lastTleTask?.completedAt?.toISOString(),
      lastDiscosSync: lastDiscosTask?.completedAt?.toISOString(),
    };
  }

  /**
   * 开始同步
   */
  async startSync(type: SyncType): Promise<SatelliteSyncTaskEntity> {
    // 检查是否有运行中的任务
    const runningTask = await this.getCurrentStatus();
    if (runningTask) {
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
      this.logger.error(`同步任务失败: ${error.message}`);
    });

    return task;
  }

  /**
   * 执行同步
   */
  private async executeSync(task: SatelliteSyncTaskEntity): Promise<void> {
    try {
      if (task.type === 'tle' || task.type === 'all') {
        await this.syncTle(task);
      }

      if (task.type === 'discos' || task.type === 'all') {
        await this.syncDiscos(task);
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
   * TLE 数据同步
   */
  private async syncTle(task: SatelliteSyncTaskEntity): Promise<void> {
    this.logger.log('开始 TLE 数据同步...');

    if (!this.spaceTrackUsername || !this.spaceTrackPassword) {
      throw new Error('Space-Track 凭据未配置，请检查环境变量');
    }

    // 登录获取 session
    await this.loginSpaceTrack();

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

    for (const batch of batches) {
      this.logger.log(`获取批次: ${batch.name} (NORAD ID ${batch.range})`);

      try {
        const gpData = await this.fetchGpBatch(batch.range);

        // 处理数据
        const result = await this.processAndStoreGpData(gpData);
        totalProcessed += gpData.length;
        totalSuccess += result.success;
        totalFailed += result.failed;

        // 更新任务进度
        task.total = totalProcessed;
        task.processed = totalProcessed;
        task.success = totalSuccess;
        task.failed = totalFailed;
        await this.taskRepository.save(task);

        // 批次间隔
        await this.sleep(this.BATCH_INTERVAL_MS);
      } catch (error) {
        this.logger.error(`批次 ${batch.name} 失败: ${error.message}`);
        totalFailed++;
      }
    }

    this.logger.log(`TLE 同步完成: 成功 ${totalSuccess}, 失败 ${totalFailed}`);
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
              reject(new Error(`登录失败，状态码: ${res.statusCode}`));
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

    this.logger.debug(`请求: ${url}`);

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
                reject(new Error(`API 错误: ${data.substring(0, 50)}`));
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
   * 处理并存储 GP 数据
   */
  private async processAndStoreGpData(gpData: SpaceTrackGpResponse[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const item of gpData) {
      try {
        const noradId = this.formatNoradId(item.NORAD_CAT_ID);

        // 保存 TLE
        const tleEntity = this.tleRepository.create({
          noradId,
          name: item.OBJECT_NAME,
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
   * ESA DISCOS 批量同步
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

    let processed = 0;
    let success = 0;
    let failed = 0;

    for (const meta of metadataList) {
      try {
        const discosInfo = await this.fetchDiscosData(meta.noradId);

        if (discosInfo) {
          await this.updateMetadataWithDiscos(meta.noradId, discosInfo);
          success++;
        } else {
          // 没有找到数据，也标记为已处理
          await this.metadataRepository.update(meta.noradId, { hasDiscosData: true });
          success++;
        }

        // 智能限流
        await this.handleRateLimit();
      } catch (error) {
        this.logger.warn(`获取 DISCOS 数据失败 (${meta.noradId}): ${error.message}`);
        failed++;
      }

      processed++;

      // 更新进度
      task.processed = processed;
      task.success = success;
      task.failed = failed;
      await this.taskRepository.save(task);
    }

    this.logger.log(`ESA DISCOS 同步完成: 成功 ${success}, 失败 ${failed}`);
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
}