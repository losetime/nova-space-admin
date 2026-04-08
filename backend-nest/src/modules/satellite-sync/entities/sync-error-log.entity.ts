import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

/**
 * 同步错误类型
 */
export type SyncErrorType =
  | 'missing_name'    // 缺少名称字段
  | 'parse_error'     // TLE 解析失败
  | 'duplicate'       // 重复 noradId（已有其他源数据）
  | 'database'        // 数据库保存失败
  | 'api_error'       // API 调用失败
  | 'rate_limit'      // API 限流（403/429）
  | 'network'         // 网络错误
  | 'timeout'         // 超时
  | 'other';          // 其他错误

/**
 * 卫星同步错误日志实体
 * 记录每条数据同步失败的详细信息
 */
@Entity('satellite_sync_error_logs')
@Index(['taskId'])
@Index(['noradId'])
@Index(['errorType'])
@Index(['timestamp'])
export class SatelliteSyncErrorLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ type: 'varchar', length: 50, name: 'taskid' })
  taskId: string;

  @Column({ type: 'varchar', length: 10, name: 'noradid' })
  noradId: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'name' })
  name: string;

  @Column({ type: 'varchar', length: 20, name: 'source' })
  source: string;

  @Column({ type: 'varchar', length: 30, name: 'errortype' })
  errorType: SyncErrorType;

  @Column({ type: 'text', name: 'errormessage' })
  errorMessage: string;

  @Column({ type: 'text', nullable: true, name: 'rawtle' })
  rawTle: string;

  @Column({ type: 'timestamp', name: 'timestamp' })
  timestamp: Date;
}