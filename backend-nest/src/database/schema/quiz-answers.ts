import { pgTable, serial, uuid, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { quizzes } from './quizzes';

export const quizAnswers = pgTable('education_quiz_answers', {
  id: serial('id').primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  quiz_id: integer('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  selected_index: integer('selected_index').notNull(),
  is_correct: boolean('is_correct').notNull(),
  points_earned: integer('points_earned').default(0).notNull(),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});