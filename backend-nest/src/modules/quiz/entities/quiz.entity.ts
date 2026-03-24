import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('education_quizzes')
export class Quiz {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'json' })
  options: string[];

  @Column()
  correctIndex: number;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({
    type: 'enum',
    enum: ['basic', 'advanced', 'mission', 'people'],
    default: 'basic',
  })
  category: string;

  @Column({ default: 10 })
  points: number;

  @Column({ nullable: true, unique: true, name: 'source_id' })
  sourceId: string;

  @Column({ nullable: true, name: 'source_type' })
  sourceType: string;

  @Column({ type: 'text', nullable: true, name: 'original_question' })
  originalQuestion: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}