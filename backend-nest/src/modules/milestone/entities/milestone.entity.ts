import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MilestoneCategory {
  LAUNCH = 'launch',
  RECOVERY = 'recovery',
  ORBIT = 'orbit',
  MISSION = 'mission',
  OTHER = 'other',
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  caption?: string;
}

@Entity('milestones')
export class Milestone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column()
  eventDate: Date;

  @Column({ type: 'enum', enum: MilestoneCategory, default: MilestoneCategory.OTHER })
  category: MilestoneCategory;

  @Column({ nullable: true })
  cover: string;

  @Column({ type: 'jsonb', nullable: true })
  media: MediaItem[];

  @Column({ nullable: true })
  relatedSatelliteNoradId: string;

  @Column({ default: 1 })
  importance: number;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  organizer: string;

  @Column({ default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}