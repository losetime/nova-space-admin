import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { PointsAction } from '../enums/user.enum';
import { User } from './user.entity';

@Entity('points_records')
export class PointsRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.pointsRecords)
  user: User;

  @Column({
    type: 'simple-enum',
    enum: PointsAction,
  })
  action: PointsAction;

  @Column()
  points: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  relatedId: string;

  @Column({ nullable: true })
  relatedType: string;

  @CreateDateColumn()
  createdAt: Date;
}