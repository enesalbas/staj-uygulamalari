import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const developers = sqliteTable("developers", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  team: text("team"),
});

export const mergeRequests = sqliteTable("merge_requests", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  developerId: integer("developer_id").notNull().references(() => developers.id),
  createdAt: text("created_at").notNull(),
  mergedAt: text("merged_at"),
  status: text("status").notNull(),
});

export const commits = sqliteTable("commits", {
  id: integer("id").primaryKey(),
  message: text("message").notNull(),
  developerId: integer("developer_id").notNull().references(() => developers.id),
  mergeRequestId: integer("merge_request_id").notNull().references(() => mergeRequests.id),
  createdAt: text("created_at").notNull(),
});