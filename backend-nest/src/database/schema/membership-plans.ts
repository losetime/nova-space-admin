import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  text,
  jsonb,
} from "drizzle-orm/pg-core";

export const membershipPlans = pgTable("membership_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  planCode: varchar("plan_code", { length: 50 }).notNull().unique(),
  durationMonths: integer("duration_months").notNull(),
  level: varchar("level", { length: 50 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  pointsPrice: integer("points_price"),
  description: text("description"),
  features: jsonb("features"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
