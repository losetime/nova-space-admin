import { pgTable, varchar, timestamp, integer } from "drizzle-orm/pg-core";

export const benefits = pgTable("benefits", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 50 }).unique(),
  category: varchar("category", { length: 50 }).default("general"),
  description: varchar("description", { length: 255 }),
  valueType: varchar("value_type", { length: 20 }).default("number"),
  unit: varchar("unit", { length: 50 }),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Benefit = typeof benefits.$inferSelect;
export type NewBenefit = typeof benefits.$inferInsert;
