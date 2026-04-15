import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  pgEnum,
  index,
  text,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const pushSubscriptionStatusEnum = pgEnum("push_subscription_status", [
  "active",
  "paused",
  "cancelled",
]);
export const subscriptionTypeEnum = pgEnum("subscription_type", [
  "space_weather",
  "intelligence",
]);
export const pushTriggerTypeEnum = pgEnum("push_trigger_type", [
  "scheduled",
  "manual",
]);
export const pushRecordStatusEnum = pgEnum("push_record_status", [
  "sent",
  "failed",
]);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    subscriptionTypes: text("subscription_types").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    status: pushSubscriptionStatusEnum("status").default("active").notNull(),
    lastPushAt: timestamp("last_push_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("push_subscriptions_user_id_idx").on(table.userId)],
);

export const pushRecords = pgTable(
  "push_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    triggerType: pushTriggerTypeEnum("trigger_type")
      .default("manual")
      .notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    content: text("content").notNull(),
    sentAt: timestamp("sent_at", { mode: "date" }).notNull(),
    status: pushRecordStatusEnum("status").notNull(),
    errorMessage: varchar("error_message", { length: 500 }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("push_records_user_id_idx").on(table.userId)],
);
