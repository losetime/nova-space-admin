import { pgTable, uuid, varchar, boolean, timestamp, pgEnum, index, text } from 'drizzle-orm/pg-core';
import { users } from './users';

export const pushSubscriptionStatusEnum = pgEnum('push_subscription_status', ['active', 'paused', 'cancelled']);
export const subscriptionTypeEnum = pgEnum('subscription_type', ['space_weather', 'intelligence']);
export const pushTriggerTypeEnum = pgEnum('push_trigger_type', ['scheduled', 'manual']);
export const pushRecordStatusEnum = pgEnum('push_record_status', ['sent', 'failed']);

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    subscription_types: text('subscription_types').notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    status: pushSubscriptionStatusEnum('status').default('active').notNull(),
    last_push_at: timestamp('last_push_at', { mode: 'date' }),
    created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [index('push_subscriptions_user_id_idx').on(table.user_id)]
);

export const pushRecords = pgTable(
  'push_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    trigger_type: pushTriggerTypeEnum('trigger_type').default('manual').notNull(),
    subject: varchar('subject', { length: 255 }).notNull(),
    content: text('content').notNull(),
    sent_at: timestamp('sent_at', { mode: 'date' }).notNull(),
    status: pushRecordStatusEnum('status').notNull(),
    error_message: varchar('error_message', { length: 500 }),
    created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [index('push_records_user_id_idx').on(table.user_id)]
);