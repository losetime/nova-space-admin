import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const milestoneCategoryEnum = pgEnum("milestone_category", [
  "launch",
  "recovery",
  "orbit",
  "mission",
  "other",
]);

export const milestones = pgTable(
  "milestones",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    content: text("content"),
    eventDate: date("event_date", { mode: "date" }).notNull(),
    category: milestoneCategoryEnum("category").default("other").notNull(),
    cover: varchar("cover", { length: 500 }),
    media:
      jsonb("media").$type<
        { type: "image" | "video"; url: string; caption?: string }[]
      >(),
    relatedSatelliteNoradId: varchar("related_satellite_norad_id", {
      length: 20,
    }),
    importance: integer("importance").default(1).notNull(),
    location: varchar("location", { length: 100 }),
    organizer: varchar("organizer", { length: 100 }),
    isPublished: boolean("is_published").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("milestones_event_date_idx").on(table.eventDate)],
);
