import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { PushTriggerType, PushRecordStatus } from '../../../common/enums/push.enum';
import { User } from '../../../common/entities/user.entity';

@Entity('push_records')
export class PushRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column({
    type: 'simple-enum',
    enum: PushTriggerType,
    default: PushTriggerType.MANUAL,
  })
  triggerType: PushTriggerType;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  sentAt: Date;

  @Column({
    type: 'simple-enum',
    enum: PushRecordStatus,
  })
  status: PushRecordStatus;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}