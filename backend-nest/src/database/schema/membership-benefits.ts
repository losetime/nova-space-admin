import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const membershipBenefitLevelEnum = pgEnum("membership_benefit_level", [
  "basic",
  "advanced",
  "professional",
]);

export const membershipBenefits = pgTable(
  "membership_benefits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    level: membershipBenefitLevelEnum("level").notNull(),
    benefitType: varchar("benefit_type", { length: 50 }).notNull(),
    benefitValue: text("benefit_value").notNull(),
    description: varchar("description", { length: 255 }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("membership_benefits_level_type_idx").on(
      table.level,
      table.benefitType,
    ),
  ],
);