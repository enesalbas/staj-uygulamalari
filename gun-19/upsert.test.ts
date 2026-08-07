import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import { repos } from "./schema.js";

function testVeritabaniKur() {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE repos (
      id integer PRIMARY KEY,
      name text NOT NULL,
      language text,
      stars integer NOT NULL,
      url text NOT NULL,
      fetched_at text NOT NULL
    );
  `);
  return drizzle(sqlite);
}

function upsert(db: ReturnType<typeof testVeritabaniKur>, repo: typeof repos.$inferInsert) {
  db.insert(repos)
    .values(repo)
    .onConflictDoUpdate({
      target: repos.id,
      set: {
        name: sql`excluded.name`,
        language: sql`excluded.language`,
        stars: sql`excluded.stars`,
        url: sql`excluded.url`,
        fetchedAt: sql`excluded.fetched_at`,
      },
    })
    .run();
}

describe("upsert davranisi", () => {
  it("ayni id'li kaydi iki kez islemek satir sayisini artirmamali", () => {
    const db = testVeritabaniKur();
    const repo = { id: 1, name: "test-repo", language: "TypeScript", stars: 10, url: "x", fetchedAt: "t1" };

    upsert(db, repo);
    upsert(db, repo);

    const tumKayitlar = db.select().from(repos).all();
    expect(tumKayitlar).toHaveLength(1);
  });

  it("ikinci islemede degerleri guncellemeli, eskiyi korumamali", () => {
    const db = testVeritabaniKur();

    upsert(db, { id: 1, name: "eski-isim", language: "TypeScript", stars: 10, url: "x", fetchedAt: "t1" });
    upsert(db, { id: 1, name: "yeni-isim", language: "TypeScript", stars: 999, url: "x", fetchedAt: "t2" });

    const kayit = db.select().from(repos).all()[0];
    expect(kayit?.name).toBe("yeni-isim");
    expect(kayit?.stars).toBe(999);
  });

  it("farkli id'li kayitlar ayri ayri eklenmeli", () => {
    const db = testVeritabaniKur();

    upsert(db, { id: 1, name: "repo-1", language: "TypeScript", stars: 10, url: "x", fetchedAt: "t" });
    upsert(db, { id: 2, name: "repo-2", language: "Python", stars: 20, url: "y", fetchedAt: "t" });

    const tumKayitlar = db.select().from(repos).all();
    expect(tumKayitlar).toHaveLength(2);
  });
});