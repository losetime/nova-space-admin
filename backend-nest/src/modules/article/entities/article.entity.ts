import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('education_articles')
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ length: 500, nullable: true })
  cover: string;

  @Column({
    type: 'enum',
    enum: ['basic', 'advanced', 'mission', 'people'],
    default: 'basic',
  })
  category: string;

  @Column({
    type: 'enum',
    enum: ['article', 'video'],
    default: 'article',
  })
  type: string;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  likes: number;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}