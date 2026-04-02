import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { FavoriteType } from '../enums/user.enum';
import { User } from './user.entity';

@Entity('user_favorites')
@Index(['userId', 'targetId', 'type'], { unique: true })
export class UserFavorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.favorites)
  user: User;

  @Column()
  targetId: string;

  @Column({
    type: 'simple-enum',
    enum: FavoriteType,
  })
  type: FavoriteType;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}