import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum IntelligenceCategory {
  LAUNCH = 'launch',
  SATELLITE = 'satellite',
  INDUSTRY = 'industry',
  RESEARCH = 'research',
  ENVIRONMENT = 'environment',
}

export enum IntelligenceLevel {
  FREE = 'free',
  ADVANCED = 'advanced',
  PROFESSIONAL = 'professional',
}

@Entity('intelligences')
export class Intelligence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  cover: string;

  @Column({
    type: 'enum',
    enum: IntelligenceCategory,
    default: IntelligenceCategory.LAUNCH,
  })
  category: IntelligenceCategory;

  @Column({
    type: 'enum',
    enum: IntelligenceLevel,
    default: IntelligenceLevel.FREE,
  })
  level: IntelligenceLevel;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  collects: number;

  @Column()
  source: string;

  @Column({ nullable: true })
  sourceUrl: string;

  @Column({ type: 'text', nullable: true })
  tags: string;

  @Column({ type: 'text', nullable: true })
  analysis: string;

  @Column({ type: 'text', nullable: true })
  trend: string;

  @Column({ nullable: true })
  publishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}