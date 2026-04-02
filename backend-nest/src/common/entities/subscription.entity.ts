import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { SubscriptionStatus, SubscriptionPlan } from '../enums/user.enum';
import { User } from './user.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.subscription)
  user: User;

  @Column({
    type: 'simple-enum',
    enum: SubscriptionPlan,
  })
  plan: SubscriptionPlan;

  @Column({
    type: 'simple-enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'CNY' })
  currency: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ default: false })
  autoRenew: boolean;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}