import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('company')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  @Index()
  name: string;

  @Column({ length: 50, nullable: true })
  @Index()
  country: string;

  @Column({ type: 'int', nullable: true })
  foundedYear: number;

  @Column({ length: 255, nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  logoUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}