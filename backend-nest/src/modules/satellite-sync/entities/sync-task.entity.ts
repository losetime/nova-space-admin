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
 * 记录每次同步任务的执行状态和进度
 */
@Entity('satellite_sync_tasks')
@Index(['status'])
@Index(['type'])
@Index(['startedAt'])
export class SatelliteSyncTaskEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string; // 如 sync-20260326-001

  @Column({ type: 'varchar', length: 20 })
  type: SyncType;

  @Column({ type: 'varchar', length: 20 })
  status: SyncStatus;

  @Column({ type: 'int', default: 0 })
  total: number;

  @Column({ type: 'int', default: 0 })
  processed: number;

  @Column({ type: 'int', default: 0 })
  success: number;

  @Column({ type: 'int', default: 0 })
  failed: number;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}