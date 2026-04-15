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
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").default("system").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    is_read: boolean("is_read").default(false).notNull(),
    related_id: uuid("related_id"),
    related_type: varchar("related_type", { length: 50 }),
    created_at: timestamp("created_at", { mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notifications_user_id_is_read_idx").on(table.user_id, table.is_read),
    index("notifications_user_id_created_at_idx").on(
      table.user_id,
      table.created_at,
    ),
  ],
);
