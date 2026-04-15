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
    noradId: varchar("norad_id", { length: 10 }).primaryKey(),
    source: varchar("source", { length: 20 }).default("celestrak").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    line1: text("line1").notNull(),
    line2: text("line2").notNull(),
    epoch: timestamp("epoch", { mode: "date" }),
    inclination: doublePrecision("inclination"),
    raan: doublePrecision("raan"),
    eccentricity: doublePrecision("eccentricity"),
    argOfPerigee: doublePrecision("arg_of_perigee"),
    meanMotion: doublePrecision("mean_motion"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("satellite_tle_updated_at_idx").on(table.updatedAt),
    index("satellite_tle_source_idx").on(table.source),
  ],
);
