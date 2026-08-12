import { sql } from "drizzle-orm";
import { db } from "./client.js";
import { repos } from "./schema.js";
import { kosullariOlustur, type ListSecenekleri } from "./query-builder.js";
import type { repoyaDonustur } from "../validation/github-repo.js";

type Repo = ReturnType<typeof repoyaDonustur>;

// Bir grup donusturulmus repoyu veritabanina yazar.
// Ayni id zaten varsa insert etmez, mevcut satiri gunceller (upsert).
export function reposuKaydet(donusturulmus: Repo[]): void {
  for (const repo of donusturulmus) {
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
}

// Filtrelere uyan repolari veritabanindan okur. Filtre yoksa hepsini dondurur.
// Kosul kurma islemi (saf mantik) query-builder.ts'e, calistirma (yan etkili
// veritabani erisimi) burada.
export function reposuListele(secenekler: ListSecenekleri) {
  const kosul = kosullariOlustur(secenekler);
  return kosul ? db.select().from(repos).where(kosul).all() : db.select().from(repos).all();
}