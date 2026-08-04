import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const repos = sqliteTable("repos", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  language: text("language"),
  stars: integer("stars").notNull(),
  url: text("url").notNull(),
  fetchedAt: text("fetched_at").notNull(),
});