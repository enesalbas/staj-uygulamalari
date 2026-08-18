import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { repos } from "./schema.js";
import { reposuOzetle } from "./stats.js";

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

describe("reposuOzetle", () => {
  it("bos veritabaninda toplamRepo 0 ve digerleri bos/null donmeli", () => {
    const testDb = testVeritabaniKur();
    const ozet = reposuOzetle(testDb);
    expect(ozet.toplamRepo).toBe(0);
    expect(ozet.dilDagilimi).toEqual([]);
    expect(ozet.enYildizli).toEqual([]);
    expect(ozet.sonFetch).toBeNull();
  });

  it("dile gore dogru gruplama ve yuzde hesabi yapmali", () => {
    const testDb = testVeritabaniKur();
    testDb.insert(repos).values([
      { id: 1, name: "a", language: "TypeScript", stars: 500, url: "x", fetchedAt: "t1" },
      { id: 2, name: "b", language: "TypeScript", stars: 10, url: "y", fetchedAt: "t2" },
      { id: 3, name: "c", language: "Python", stars: 300, url: "z", fetchedAt: "t3" },
    ]).run();

    const ozet = reposuOzetle(testDb);
    expect(ozet.toplamRepo).toBe(3);
    expect(ozet.dilDagilimi).toEqual([
      { language: "TypeScript", adet: 2, yuzde: 66.7 },
      { language: "Python", adet: 1, yuzde: 33.3 },
    ]);
  });

  it("language null ise 'Bilinmiyor' olarak gruplamali", () => {
    const testDb = testVeritabaniKur();
    testDb.insert(repos).values([
      { id: 1, name: "a", language: null, stars: 10, url: "x", fetchedAt: "t" },
    ]).run();

    const ozet = reposuOzetle(testDb);
    expect(ozet.dilDagilimi).toEqual([{ language: "Bilinmiyor", adet: 1, yuzde: 100 }]);
  });

  it("en yildizli 5'i azalan sirada dondurmeli", () => {
    const testDb = testVeritabaniKur();
    testDb.insert(repos).values([
      { id: 1, name: "dusuk", language: "TS", stars: 10, url: "x", fetchedAt: "t" },
      { id: 2, name: "yuksek", language: "TS", stars: 500, url: "y", fetchedAt: "t" },
      { id: 3, name: "orta", language: "TS", stars: 100, url: "z", fetchedAt: "t" },
    ]).run();

    const ozet = reposuOzetle(testDb);
    expect(ozet.enYildizli.map((r) => r.name)).toEqual(["yuksek", "orta", "dusuk"]);
  });

  it("en yeni fetchedAt degerini sonFetch olarak dondurmeli", () => {
    const testDb = testVeritabaniKur();
    testDb.insert(repos).values([
      { id: 1, name: "a", language: "TS", stars: 10, url: "x", fetchedAt: "2026-08-18T09:00:00.000Z" },
      { id: 2, name: "b", language: "TS", stars: 20, url: "y", fetchedAt: "2026-08-18T11:00:00.000Z" },
    ]).run();

    const ozet = reposuOzetle(testDb);
    expect(ozet.sonFetch).toBe("2026-08-18T11:00:00.000Z");
  });
});