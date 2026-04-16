import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "intelligence",
  "system",
  "achievement",
  "membership",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").default("system").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    relatedId: uuid("related_id"),
    relatedType: varchar("related_type", { length: 50 }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_id_is_read_idx").on(table.userId, table.isRead),
    index("notifications_user_id_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);
