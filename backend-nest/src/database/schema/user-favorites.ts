import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const favoriteTypeEnum = pgEnum("favorite_type", [
  "satellite",
  "news",
  "education",
  "intelligence",
]);

export const userFavorites = pgTable(
  "user_favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetId: varchar("target_id", { length: 100 }).notNull(),
    type: favoriteTypeEnum("type").notNull(),
    note: varchar("note", { length: 255 }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_favorites_user_target_type_idx").on(
      table.userId,
      table.targetId,
      table.type,
    ),
  ],
);
