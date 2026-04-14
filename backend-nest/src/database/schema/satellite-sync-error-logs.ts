import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';

export type SyncErrorType =
  | 'missing_name'
  | 'parse_error'
  | 'duplicate'
  | 'database'
  | 'api_error'
  | 'rate_limit'
  | 'network'
  | 'timeout'
  | 'other';

export const satelliteSyncErrorLogs = pgTable(
  'satellite_sync_error_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    task_id: varchar('task_id', { length: 50 }).notNull(),
    norad_id: varchar('norad_id', { length: 10 }).notNull(),
    name: varchar('name', { length: 200 }),
    source: varchar('source', { length: 20 }).notNull(),
    error_type: varchar('error_type', { length: 30 }).notNull(),
    error_message: text('error_message').notNull(),
    raw_tle: text('raw_tle'),
    timestamp: timestamp('timestamp', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('satellite_sync_error_logs_task_id_idx').on(table.task_id),
    index('satellite_sync_error_logs_norad_id_idx').on(table.norad_id),
    index('satellite_sync_error_logs_error_type_idx').on(table.error_type),
    index('satellite_sync_error_logs_timestamp_idx').on(table.timestamp),
  ]
);