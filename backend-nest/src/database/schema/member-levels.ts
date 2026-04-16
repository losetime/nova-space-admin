import { pgTable, varchar, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const memberLevels = pgTable('member_levels', {
  id: varchar('id', { length: 36 }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 255 }),
  icon: varchar('icon', { length: 10 }),
  isDefault: boolean('is_default').default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type MemberLevel = typeof memberLevels.$inferSelect;
export type NewMemberLevel = typeof memberLevels.$inferInsert;