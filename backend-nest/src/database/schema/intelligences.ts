import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const intelligenceCategoryEnum = pgEnum("intelligence_category", [
  "launch",
  "satellite",
  "industry",
  "research",
  "environment",
]);
export const intelligenceLevelEnum = pgEnum("intelligence_level", [
  "free",
  "advanced",
  "professional",
]);

export const intelligences = pgTable("intelligences", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  cover: varchar("cover", { length: 500 }),
  category: intelligenceCategoryEnum("category").default("launch").notNull(),
  level: intelligenceLevelEnum("level").default("free").notNull(),
  views: integer("views").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  collects: integer("collects").default(0).notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  sourceUrl: varchar("source_url", { length: 500 }),
  tags: text("tags"),
  analysis: text("analysis"),
  trend: text("trend"),
  publishedAt: timestamp("published_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
