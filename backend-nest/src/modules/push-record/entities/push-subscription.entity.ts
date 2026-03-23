import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { PushSubscriptionStatus, SubscriptionType } from '../../../common/enums/push.enum';
import { User } from '../../../common/entities/user.entity';

@Entity('push_subscriptions')
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  email: string;

  // 订阅内容类型
  @Column({
    type: 'simple-array',
    default: [SubscriptionType.SPACE_WEATHER],
  })
  subscriptionTypes: SubscriptionType[];

  // 推送状态
  @Column({ default: true })
  enabled: boolean;

  @Column({
    type: 'simple-enum',
    enum: PushSubscriptionStatus,
    default: PushSubscriptionStatus.ACTIVE,
  })
  status: PushSubscriptionStatus;

  // 上次推送时间
  @Column({ nullable: true })
  lastPushAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}