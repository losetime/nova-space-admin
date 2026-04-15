import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const feedbackTypeEnum = pgEnum("feedback_type", [
  "bug",
  "feature",
  "suggestion",
  "other",
]);
export const feedbackStatusEnum = pgEnum("feedback_status", [
  "pending",
  "processing",
  "resolved",
  "closed",
]);

export const feedbacks = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  type: feedbackTypeEnum("type").default("other").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  status: feedbackStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
