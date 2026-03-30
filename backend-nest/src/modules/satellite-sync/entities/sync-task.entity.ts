import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 同步任务类型
 */
export type SyncType =
  | 'celestrak'        // CelesTrak TLE 同步
  | 'space-track'      // Space-Track TLE 同步
  | 'keeptrack-tle'    // KeepTrack TLE 同步（需 API Key）
  | 'keeptrack-meta'   // KeepTrack 元数据同步（需 API Key）
  | 'discos'           // ESA DISCOS 元数据同步
  | 'all';             // 完整同步

/**
 * 同步任务状态
 */
export type SyncStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * 卫星同步任务实体
 * 映射主项目的 satellite_sync_tasks 表
 */
@Entity('satellite_sync_tasks')
@Index(['status'])
@Index(['type'])
@Index(['startedAt'])
export class SatelliteSyncTaskEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string; // 如 sync-20260326-001

  @Column({ type: 'varchar', length: 20, name: 'type' })
  type: SyncType;

  @Column({ type: 'varchar', length: 20, name: 'status' })
  status: SyncStatus;

  @Column({ type: 'int', default: 0, name: 'total' })
  total: number;

  @Column({ type: 'int', default: 0, name: 'processed' })
  processed: number;

  @Column({ type: 'int', default: 0, name: 'success' })
  success: number;

  @Column({ type: 'int', default: 0, name: 'failed' })
  failed: number;

  @Column({ type: 'timestamp', nullable: true, name: 'startedat' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completedat' })
  completedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'error' })
  error: string;

  @CreateDateColumn({ type: 'timestamp', name: 'createdat' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedat' })
  updatedAt: Date;
}