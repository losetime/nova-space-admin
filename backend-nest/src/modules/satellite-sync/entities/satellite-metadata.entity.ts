import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 卫星元数据实体
 * 映射主项目的 satellite_metadata 表
 */
@Entity('satellite_metadata')
@Index(['countryCode'])
@Index(['objectType'])
@Index(['launchDate'])
export class SatelliteMetadataEntity {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  noradId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  objectId: string;

  @Column({ type: 'simple-array', nullable: true })
  altNames: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  objectType: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  status: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  countryCode: string;

  @Column({ type: 'date', nullable: true })
  launchDate: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  launchSite: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  launchVehicle: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  flightNo: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cosparLaunchNo: string;

  @Column({ type: 'boolean', nullable: true })
  launchFailure: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  launchSiteName: string;

  @Column({ type: 'date', nullable: true })
  decayDate: string;

  @Column({ type: 'float', nullable: true })
  period: number;

  @Column({ type: 'float', nullable: true })
  inclination: number;

  @Column({ type: 'float', nullable: true })
  apogee: number;

  @Column({ type: 'float', nullable: true })
  perigee: number;

  @Column({ type: 'float', nullable: true })
  eccentricity: number;

  @Column({ type: 'float', nullable: true })
  raan: number;

  @Column({ type: 'float', nullable: true })
  argOfPerigee: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  rcs: string;

  @Column({ type: 'float', nullable: true })
  stdMag: number;

  @Column({ type: 'timestamp', nullable: true })
  tleEpoch: Date;

  @Column({ type: 'int', nullable: true })
  tleAge: number;

  // ESA DISCOS 扩展字段
  @Column({ type: 'varchar', length: 20, nullable: true })
  cosparId: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  objectClass: string;

  @Column({ type: 'float', nullable: true })
  launchMass: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  shape: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  dimensions: string;

  @Column({ type: 'float', nullable: true })
  span: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mission: string;

  @Column({ type: 'date', nullable: true })
  firstEpoch: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  operator: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contractor: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lifetime: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  platform: string;

  @Column({ type: 'date', nullable: true })
  predDecayDate: string;

  @Column({ type: 'boolean', default: false })
  hasDiscosData: boolean;

  @Column({ type: 'boolean', default: false })
  hasExtendedData: boolean; // KeepTrack 扩展元数据标记

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}