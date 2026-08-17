import { sql } from "drizzle-orm";
import { repos } from "./schema.js";
import { kosullariOlustur, type ListSecenekleri } from "./query-builder.js";
import type { repoyaDonustur } from "../validation/github-repo.js";
import type { Db } from "./client.js";

type Repo = ReturnType<typeof repoyaDonustur>;

// db, disaridan parametre olarak aliniyor (dependency injection).
// Uretimde gercek baglanti (db/client.ts), testte bellekteki (:memory:) db geciliyor.
// Bu sayede reposuKaydet ve reposuListele, gercekten test edilebiliyor - kopyasi degil.

// Bir grup donusturulmus repoyu veritabanina yazar.
// Ayni id zaten varsa insert etmez, mevcut satiri gunceller (upsert).
export function reposuKaydet(veriTabani: Db, donusturulmus: Repo[]): void {
  for (const repo of donusturulmus) {
    veriTabani
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
}

// Filtrelere uyan repolari veritabanindan okur. Filtre yoksa hepsini dondurur.
// Kosul kurma islemi (saf mantik) query-builder.ts'e, calistirma (yan etkili
// veritabani erisimi) burada.
export function reposuListele(veriTabani: Db, secenekler: ListSecenekleri) {
  const kosul = kosullariOlustur(secenekler);
  return kosul
    ? veriTabani.select().from(repos).where(kosul).all()
    : veriTabani.select().from(repos).all();
}
