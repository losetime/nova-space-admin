import {
  pgTable,
  varchar,
  text,
  timestamp,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";

export const satelliteTle = pgTable(
  "satellite_tle",
  {
    norad_id: varchar("norad_id", { length: 10 }).primaryKey(),
    source: varchar("source", { length: 20 }).default("celestrak").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    line1: text("line1").notNull(),
    line2: text("line2").notNull(),
    epoch: timestamp("epoch", { mode: "date" }),
    inclination: doublePrecision("inclination"),
    raan: doublePrecision("raan"),
    eccentricity: doublePrecision("eccentricity"),
    arg_of_perigee: doublePrecision("arg_of_perigee"),
    mean_motion: doublePrecision("mean_motion"),
    created_at: timestamp("created_at", { mode: "date" })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("satellite_tle_updated_at_idx").on(table.updated_at),
    index("satellite_tle_source_idx").on(table.source),
  ],
);
