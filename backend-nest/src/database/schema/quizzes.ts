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
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation"),
  category: quizCategoryEnum("category").default("basic").notNull(),
  points: integer("points").default(10).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
