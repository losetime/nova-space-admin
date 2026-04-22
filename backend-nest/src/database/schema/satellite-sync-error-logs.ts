import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export type SyncErrorType =
  | "missing_name"
  | "parse_error"
  | "duplicate"
  | "database"
  | "api_error"
  | "rate_limit"
  | "network"
  | "timeout"
  | "other";

export const satelliteSyncErrorLogs = pgTable(
  "satellite_sync_error_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: varchar("task_id", { length: 50 }).notNull(),
    noradId: varchar("norad_id", { length: 10 }).notNull(),
    name: varchar("name", { length: 200 }),
    source: varchar("source", { length: 20 }).notNull(),
    errorType: varchar("error_type", { length: 30 }).notNull(),
    errorMessage: text("error_message").notNull(),
    rawTle: text("raw_tle"),
    errorDetails: jsonb("error_details"),
    timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
  },
  (table) => [
    index("satellite_sync_error_logs_task_id_idx").on(table.taskId),
    index("satellite_sync_error_logs_norad_id_idx").on(table.noradId),
    index("satellite_sync_error_logs_error_type_idx").on(table.errorType),
    index("satellite_sync_error_logs_timestamp_idx").on(table.timestamp),
  ],
);
