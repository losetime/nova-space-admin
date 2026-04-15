import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const companies = pgTable(
  "company",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    country: varchar("country", { length: 50 }),
    foundedYear: integer("founded_year"),
    website: varchar("website", { length: 255 }),
    description: text("description"),
    logoUrl: varchar("logo_url", { length: 500 }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("company_name_idx").on(table.name),
    index("company_country_idx").on(table.country),
  ],
);
