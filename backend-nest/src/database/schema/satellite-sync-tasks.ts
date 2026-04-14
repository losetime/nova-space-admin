import { pgTable, varchar, timestamp, boolean, integer, text, index } from 'drizzle-orm/pg-core';

export const syncStatusEnum = ['pending', 'running', 'completed', 'failed'] as const;
export const syncTypeEnum = ['celestrak', 'space-track', 'space-track-meta', 'keeptrack-tle', 'keeptrack-meta', 'discos'] as const;

export const satelliteSyncTasks = pgTable(
  'satellite_sync_tasks',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    type: varchar('type', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    total: integer('total').default(0).notNull(),
    processed: integer('processed').default(0).notNull(),
    success: integer('success').default(0).notNull(),
    failed: integer('failed').default(0).notNull(),
    started_at: timestamp('started_at', { mode: 'date' }),
    completed_at: timestamp('completed_at', { mode: 'date' }),
    error: text('error'),
    created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('satellite_sync_tasks_status_idx').on(table.status),
    index('satellite_sync_tasks_type_idx').on(table.type),
    index('satellite_sync_tasks_started_at_idx').on(table.started_at),
  ]
);