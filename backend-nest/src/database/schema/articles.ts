import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const articleCategoryEnum = pgEnum("article_category", [
  "basic",
  "advanced",
  "mission",
  "people",
]);
export const articleTypeEnum = pgEnum("article_type", ["article", "video"]);

export const articles = pgTable("education_articles", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  cover: varchar("cover", { length: 500 }),
  category: articleCategoryEnum("category").default("basic").notNull(),
  type: articleTypeEnum("type").default("article").notNull(),
  views: integer("views").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  duration: integer("duration"),
  tags: text("tags"),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
