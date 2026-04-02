import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserRole, UserLevel } from '../enums/user.enum';
import { Subscription } from './subscription.entity';
import { PointsRecord } from './points-record.entity';
import { UserFavorite } from './user-favorite.entity';

export { UserRole, UserLevel } from '../enums/user.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'simple-enum',
    enum: UserLevel,
    default: UserLevel.BASIC,
  })
  level: UserLevel;

  @Column({ default: 0 })
  points: number;

  @Column({ default: 0 })
  totalPoints: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastLoginIp: string;

  @OneToOne(() => Subscription, (subscription) => subscription.user)
  subscription: Subscription;

  @OneToMany(() => PointsRecord, (record) => record.user)
  pointsRecords: PointsRecord[];

  @OneToMany(() => UserFavorite, (favorite) => favorite.user)
  favorites: UserFavorite[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}