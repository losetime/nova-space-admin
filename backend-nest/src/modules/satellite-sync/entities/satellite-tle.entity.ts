import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 卫星 TLE 数据实体
 * 映射主项目的 satellite_tle 表
 */
@Entity('satellite_tle')
@Index(['updatedAt'])
export class SatelliteTle {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  noradId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  line1: string;

  @Column({ type: 'text' })
  line2: string;

  @Column({ type: 'timestamp', nullable: true })
  epoch?: Date;

  @Column({ type: 'float', nullable: true })
  inclination?: number;

  @Column({ type: 'float', nullable: true })
  raan?: number;

  @Column({ type: 'float', nullable: true })
  eccentricity?: number;

  @Column({ type: 'float', nullable: true })
  argOfPerigee?: number;

  @Column({ type: 'float', nullable: true })
  meanMotion?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}