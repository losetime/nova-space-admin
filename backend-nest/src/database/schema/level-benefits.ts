import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

export const levelBenefits = pgTable("level_benefits", {
  id: varchar("id", { length: 36 }).primaryKey(),
  levelId: varchar("level_id", { length: 36 }).notNull(),
  benefitId: varchar("benefit_id", { length: 36 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  displayText: varchar("display_text", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type LevelBenefit = typeof levelBenefits.$inferSelect;
export type NewLevelBenefit = typeof levelBenefits.$inferInsert;
