import { pgTable, serial, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { articles } from "./articles";

export const articleLikes = pgTable("article_likes", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
