import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const pointsActionEnum = pgEnum("points_action", [
  "register",
  "daily_login",
  "share",
  "invite",
  "task_complete",
  "purchase",
  "consume",
  "admin_grant",
  "expire",
]);

export const pointsRecords = pgTable("points_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: pointsActionEnum("action").notNull(),
  points: integer("points").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  description: varchar("description", { length: 255 }),
  related_id: varchar("related_id", { length: 100 }),
  related_type: varchar("related_type", { length: 50 }),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
