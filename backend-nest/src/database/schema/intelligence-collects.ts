import { pgTable, serial, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { intelligences } from "./intelligences";

export const intelligenceCollects = pgTable("intelligence_collects", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  intelligenceId: integer("intelligence_id")
    .notNull()
    .references(() => intelligences.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
