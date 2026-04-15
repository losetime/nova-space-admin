import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "admin",
  "super_admin",
]);
export const userLevelEnum = pgEnum("user_level", [
  "basic",
  "advanced",
  "professional",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  password: varchar("password", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 500 }),
  nickname: varchar("nickname", { length: 100 }),
  role: userRoleEnum("role").default("user").notNull(),
  level: userLevelEnum("level").default("basic").notNull(),
  points: integer("points").default(0).notNull(),
  total_points: integer("total_points").default(0).notNull(),
  is_verified: boolean("is_verified").default(false).notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  last_login_at: timestamp("last_login_at", { mode: "date" }),
  last_login_ip: varchar("last_login_ip", { length: 50 }),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
