import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { repos } from "./schema.js";
import { kosullariOlustur } from "./query-builder.js";
import { reposuKaydet, reposuListele } from "./repository.js";

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

describe("filtre mantigi (kosullariOlustur)", () => {
  const ornekRepolar = [
    { id: 1, name: "repo-ts-yuksek", language: "TypeScript", stars: 500, url: "x", fetchedAt: "t" },
    { id: 2, name: "repo-ts-dusuk", language: "TypeScript", stars: 10, url: "x", fetchedAt: "t" },
    { id: 3, name: "repo-python", language: "Python", stars: 300, url: "x", fetchedAt: "t" },
  ];

  it("filtresiz tum repolari donmeli", () => {
    const testDb = testVeritabaniKur();
    reposuKaydet(testDb, ornekRepolar);
    expect(reposuListele(testDb, {})).toHaveLength(3);
  });

  it("--language ile sadece o dildeki repolari suzmeli", () => {
    const testDb = testVeritabaniKur();
    reposuKaydet(testDb, ornekRepolar);
    const sonuc = reposuListele(testDb, { language: "TypeScript" });
    expect(sonuc).toHaveLength(2);
  });

  it("iki filtre birlikte verilince ikisini de saglamali", () => {
    const testDb = testVeritabaniKur();
    reposuKaydet(testDb, ornekRepolar);
    const sonuc = reposuListele(testDb, { language: "TypeScript", minStars: 100 });
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0]?.name).toBe("repo-ts-yuksek");
  });
});

describe("reposuKaydet - upsert davranisi", () => {
  it("ayni id'li kaydi iki kez islemek satir sayisini artirmamali", () => {
    const testDb = testVeritabaniKur();
    const repo = { id: 1, name: "test-repo", language: "TypeScript", stars: 10, url: "x", fetchedAt: "t1" };

    reposuKaydet(testDb, [repo]);
    reposuKaydet(testDb, [repo]);

    expect(reposuListele(testDb, {})).toHaveLength(1);
  });

  it("ikinci islemede degerleri guncellemeli", () => {
    const testDb = testVeritabaniKur();
    reposuKaydet(testDb, [{ id: 1, name: "eski", language: "TypeScript", stars: 10, url: "x", fetchedAt: "t1" }]);
    reposuKaydet(testDb, [{ id: 1, name: "yeni", language: "TypeScript", stars: 999, url: "x", fetchedAt: "t2" }]);

    const kayit = reposuListele(testDb, {})[0];
    expect(kayit?.name).toBe("yeni");
    expect(kayit?.stars).toBe(999);
  });

  it("stars alani yanlislikla silinse test bunu yakalamali (regresyon kontrolu)", () => {
    // Bu test, gercek reposuKaydet'i cagirdigi icin, biri onConflictDoUpdate'in
    // set listesinden 'stars' satirini silse bu test kirmizi cikar.
    const testDb = testVeritabaniKur();
    reposuKaydet(testDb, [{ id: 1, name: "a", language: "TS", stars: 5, url: "x", fetchedAt: "t" }]);
    reposuKaydet(testDb, [{ id: 1, name: "a", language: "TS", stars: 500, url: "x", fetchedAt: "t2" }]);

    expect(reposuListele(testDb, {})[0]?.stars).toBe(500);
  });
});