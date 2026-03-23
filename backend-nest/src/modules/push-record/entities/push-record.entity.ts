import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('push_records')
export class PushRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '关联内容类型: article/intelligence' })
  contentType: string;

  @Column({ comment: '关联内容ID' })
  contentId: number;

  @Column({ length: 200, comment: '内容标题' })
  title: string;

  @Column({
    type: 'enum',
    enum: ['all', 'basic', 'advanced', 'professional'],
    default: 'all',
    comment: '推送目标用户等级',
  })
  targetLevel: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'sending', 'success', 'failed'],
    default: 'pending',
    comment: '推送状态',
  })
  status: string;

  @Column({ type: 'int', default: 0, comment: '推送成功数量' })
  successCount: number;

  @Column({ type: 'int', default: 0, comment: '推送失败数量' })
  failCount: number;

  @Column({ type: 'text', nullable: true, comment: '错误信息' })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true, comment: '推送时间' })
  pushedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}