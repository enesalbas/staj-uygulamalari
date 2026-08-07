import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { repos } from "./schema.js";
import { kosullariOlustur } from "./filtre.js";

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
  const db = drizzle(sqlite);

  db.insert(repos).values([
    { id: 1, name: "repo-ts-yuksek", language: "TypeScript", stars: 500, url: "x", fetchedAt: "t" },
    { id: 2, name: "repo-ts-dusuk", language: "TypeScript", stars: 10, url: "x", fetchedAt: "t" },
    { id: 3, name: "repo-python", language: "Python", stars: 300, url: "x", fetchedAt: "t" },
  ]).run();

  return db;
}

describe("list komutu filtre mantigi", () => {
  it("filtresiz tum repolari donmeli", () => {
    const db = testVeritabaniKur();
    const kosul = kosullariOlustur({});
    const sonuc = kosul ? db.select().from(repos).where(kosul).all() : db.select().from(repos).all();
    expect(sonuc).toHaveLength(3);
  });

  it("--language ile sadece o dildeki repolari suzmeli", () => {
    const db = testVeritabaniKur();
    const kosul = kosullariOlustur({ language: "TypeScript" });
    const sonuc = db.select().from(repos).where(kosul!).all();
    expect(sonuc).toHaveLength(2);
    expect(sonuc.every((r) => r.language === "TypeScript")).toBe(true);
  });

  it("--min-stars ile sadece esik ustundeki repolari suzmeli", () => {
    const db = testVeritabaniKur();
    const kosul = kosullariOlustur({ minStars: 100 });
    const sonuc = db.select().from(repos).where(kosul!).all();
    expect(sonuc).toHaveLength(2);
    expect(sonuc.every((r) => r.stars >= 100)).toBe(true);
  });

  it("iki filtre birlikte verilince ikisini de saglamali", () => {
    const db = testVeritabaniKur();
    const kosul = kosullariOlustur({ language: "TypeScript", minStars: 100 });
    const sonuc = db.select().from(repos).where(kosul!).all();
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0]!.name).toBe("repo-ts-yuksek");
  });
});