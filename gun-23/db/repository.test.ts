import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import { repos } from "./schema.js";
import { kosullariOlustur } from "./query-builder.js";

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

function upsert(testDb: ReturnType<typeof testVeritabaniKur>, repo: typeof repos.$inferInsert) {
  testDb
    .insert(repos)
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

describe("filtre mantigi (kosullariOlustur)", () => {
  const ornekRepolar = [
    { id: 1, name: "repo-ts-yuksek", language: "TypeScript", stars: 500, url: "x", fetchedAt: "t" },
    { id: 2, name: "repo-ts-dusuk", language: "TypeScript", stars: 10, url: "x", fetchedAt: "t" },
    { id: 3, name: "repo-python", language: "Python", stars: 300, url: "x", fetchedAt: "t" },
  ];

  it("filtresiz tum repolari donmeli", () => {
    const testDb = testVeritabaniKur();
    ornekRepolar.forEach((r) => upsert(testDb, r));
    const kosul = kosullariOlustur({});
    const sonuc = kosul
      ? testDb.select().from(repos).where(kosul).all()
      : testDb.select().from(repos).all();
    expect(sonuc).toHaveLength(3);
  });

  it("--language ile sadece o dildeki repolari suzmeli", () => {
    const testDb = testVeritabaniKur();
    ornekRepolar.forEach((r) => upsert(testDb, r));
    const kosul = kosullariOlustur({ language: "TypeScript" });
    const sonuc = testDb.select().from(repos).where(kosul!).all();
    expect(sonuc).toHaveLength(2);
  });

  it("iki filtre birlikte verilince ikisini de saglamali", () => {
    const testDb = testVeritabaniKur();
    ornekRepolar.forEach((r) => upsert(testDb, r));
    const kosul = kosullariOlustur({ language: "TypeScript", minStars: 100 });
    const sonuc = testDb.select().from(repos).where(kosul!).all();
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0]?.name).toBe("repo-ts-yuksek");
  });
});

describe("upsert davranisi", () => {
  it("ayni id'li kaydi iki kez islemek satir sayisini artirmamali", () => {
    const testDb = testVeritabaniKur();
    const repo = {
      id: 1,
      name: "test-repo",
      language: "TypeScript",
      stars: 10,
      url: "x",
      fetchedAt: "t1",
    };

    upsert(testDb, repo);
    upsert(testDb, repo);

    expect(testDb.select().from(repos).all()).toHaveLength(1);
  });

  it("ikinci islemede degerleri guncellemeli", () => {
    const testDb = testVeritabaniKur();
    upsert(testDb, {
      id: 1,
      name: "eski",
      language: "TypeScript",
      stars: 10,
      url: "x",
      fetchedAt: "t1",
    });
    upsert(testDb, {
      id: 1,
      name: "yeni",
      language: "TypeScript",
      stars: 999,
      url: "x",
      fetchedAt: "t2",
    });

    const kayit = testDb.select().from(repos).all()[0];
    expect(kayit?.name).toBe("yeni");
    expect(kayit?.stars).toBe(999);
  });
});
