import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { and, count, desc, eq, gte, isNull } from "drizzle-orm";
import { developers, mergeRequests, commits } from "./schema.js";

const sqlite = new Database("staj.db");
const db = drizzle(sqlite);

function baslik(metin: string) {
  console.log(`\n=== ${metin} ===`);
}

// 1. Her gelistiricinin toplam commit sayisi (azalan)
baslik("1. Gelistirici basina commit sayisi");

const commitSayilari = db
  .select({
    isim: developers.name,
    commitSayisi: count(commits.id),
  })
  .from(developers)
  .leftJoin(commits, eq(developers.id, commits.developerId))
  .groupBy(developers.id, developers.name)
  .orderBy(desc(count(commits.id)))
  .all();

console.table(commitSayilari);

// 2. Son 30 gunde acilmis ama henuz merge edilmemis MR'lar
baslik("2. Son 30 gunde acilmis, merge edilmemis MR'lar");

const otuzGunOnce = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

const acikMrler = db
  .select({
    id: mergeRequests.id,
    baslik: mergeRequests.title,
    olusturma: mergeRequests.createdAt,
    durum: mergeRequests.status,
  })
  .from(mergeRequests)
  .where(and(gte(mergeRequests.createdAt, otuzGunOnce), isNull(mergeRequests.mergedAt)))
  .all();

console.table(acikMrler);

// 3. En cok commit yapan ilk 5 gelistirici
baslik("3. En cok commit yapan ilk 5 gelistirici");

const ilkBes = db
  .select({
    isim: developers.name,
    commitSayisi: count(commits.id),
  })
  .from(commits)
  .innerJoin(developers, eq(commits.developerId, developers.id))
  .groupBy(developers.id, developers.name)
  .orderBy(desc(count(commits.id)))
  .limit(5)
  .all();

console.table(ilkBes);

// 4. Her takim icin MR sayisi
baslik("4. Takim basina MR sayisi");

const takimMrleri = db
  .select({
    takim: developers.team,
    mrSayisi: count(mergeRequests.id),
  })
  .from(mergeRequests)
  .innerJoin(developers, eq(mergeRequests.developerId, developers.id))
  .groupBy(developers.team)
  .orderBy(desc(count(mergeRequests.id)))
  .all();

console.table(takimMrleri);

// 5. Hic commit'i olmayan gelistiriciler (LEFT JOIN)
// INNER JOIN ile bulunamaz: eslesme olmayan satirlar sonuctan tamamen duser,
// yani aradigimiz kayitlar en basta elenir.
baslik("5. Hic commit'i olmayan gelistiriciler");

const commitsizler = db
  .select({
    id: developers.id,
    isim: developers.name,
    takim: developers.team,
  })
  .from(developers)
  .leftJoin(commits, eq(developers.id, commits.developerId))
  .where(isNull(commits.id))
  .all();

console.table(commitsizler);