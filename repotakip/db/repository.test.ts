import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { repos } from "./schema.js";
import { kosullariOlustur, siralamaOlustur } from "./query-builder.js";
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

const ornekRepolar = [
  { id: 1, name: "zebra-repo", language: "TypeScript", stars: 500, url: "x", fetchedAt: "t" },
  { id: 2, name: "alpha-repo", language: "TypeScript", stars: 10, url: "x", fetchedAt: "t" },
  { id: 3, name: "middle-repo", language: "Python", stars: 300, url: "x", fetchedAt: "t" },
];

describe("filtre mantigi (kosullariOlustur)", () => {
it("transaction icinde bir kayit hata verirse hicbir kayit yazilmamali (rollback)", () => {
  const testDb = testVeritabaniKur();
  const gecerli = { id: 1, name: "gecerli", language: "TS", stars: 5, url: "x", fetchedAt: "t" };
  const gecersiz = { id: 2, name: null, language: "TS", stars: 10, url: "y", fetchedAt: "t" } as never;

  expect(() => reposuKaydet(testDb, [gecerli, gecersiz])).toThrow();
  expect(reposuListele(testDb, {})).toHaveLength(0);
});

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
    expect(sonuc[0]?.name).toBe("zebra-repo");
  });
});

describe("siralama mantigi", () => {
  it("varsayilan olarak yildiza gore azalan siralamali", () => {
    const testDb = testVeritabaniKur();
    reposuKaydet(testDb, ornekRepolar);
    const sonuc = reposuListele(testDb, {});
    expect(sonuc.map((r) => r.name)).toEqual(["zebra-repo", "middle-repo", "alpha-repo"]);
  });

  it("--sort name ile alfabetik artan siralamali", () => {
    const testDb = testVeritabaniKur();
    reposuKaydet(testDb, ornekRepolar);
    const sonuc = reposuListele(testDb, { sort: "name" });
    expect(sonuc.map((r) => r.name)).toEqual(["alpha-repo", "middle-repo", "zebra-repo"]);
  });

  it("--sort stars ile yildiza gore azalan siralamali", () => {
    const testDb = testVeritabaniKur();
    reposuKaydet(testDb, ornekRepolar);
    const sonuc = reposuListele(testDb, { sort: "stars" });
    expect(sonuc.map((r) => r.stars)).toEqual([500, 300, 10]);
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

  it("ikinci islemede degerleri guncellemeli (stars regresyon kontrolu)", () => {
    const testDb = testVeritabaniKur();
    reposuKaydet(testDb, [{ id: 1, name: "eski", language: "TypeScript", stars: 10, url: "x", fetchedAt: "t1" }]);
    reposuKaydet(testDb, [{ id: 1, name: "yeni", language: "TypeScript", stars: 999, url: "x", fetchedAt: "t2" }]);

    const kayit = reposuListele(testDb, {})[0];
    expect(kayit?.name).toBe("yeni");
    expect(kayit?.stars).toBe(999);
  });
});