import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  pgEnum,
  json,
} from "drizzle-orm/pg-core";

export const quizCategoryEnum = pgEnum("quiz_category", [
  "basic",
  "advanced",
  "mission",
  "people",
]);

export const quizzes = pgTable("education_quizzes", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: json("options").$type<string[]>().notNull(),
  correct_index: integer("correct_index").notNull(),
  explanation: text("explanation"),
  category: quizCategoryEnum("category").default("basic").notNull(),
  points: integer("points").default(10).notNull(),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
