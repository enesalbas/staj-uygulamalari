import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { config } from "../config/config.js";

export const sqlite = new Database(config.DB_PATH);
export const db = drizzle(sqlite);
export type Db = typeof db;
