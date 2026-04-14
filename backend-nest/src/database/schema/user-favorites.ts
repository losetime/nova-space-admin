import { pgTable, uuid, varchar, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const favoriteTypeEnum = pgEnum('favorite_type', ['satellite', 'news', 'education', 'intelligence']);

export const userFavorites = pgTable(
  'user_favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    target_id: varchar('target_id', { length: 100 }).notNull(),
    type: favoriteTypeEnum('type').notNull(),
    note: varchar('note', { length: 255 }),
    created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('user_favorites_user_target_type_idx').on(table.user_id, table.target_id, table.type)]
);