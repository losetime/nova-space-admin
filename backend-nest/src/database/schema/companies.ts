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
    founded_year: integer("founded_year"),
    website: varchar("website", { length: 255 }),
    description: text("description"),
    logo_url: varchar("logo_url", { length: 500 }),
    created_at: timestamp("created_at", { mode: "date" })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("company_name_idx").on(table.name),
    index("company_country_idx").on(table.country),
  ],
);
