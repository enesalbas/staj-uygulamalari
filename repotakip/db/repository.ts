import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { repos } from "./schema.js";
import { kosullariOlustur, siralamaOlustur, type ListSecenekleri } from "./query-builder.js";
import type { repoyaDonustur } from "../validation/github-repo.js";

type Repo = ReturnType<typeof repoyaDonustur>;
type VeriTabani = ReturnType<typeof drizzle>;

// db, disaridan parametre olarak aliniyor (dependency injection).
// Uretimde gercek baglanti (db/client.ts), testte bellekteki (:memory:) db geciliyor.
// Bu sayede reposuKaydet ve reposuListele, gercekten test edilebiliyor - kopyasi degil.

// Bir grup donusturulmus repoyu TEK BIR TRANSACTION icinde veritabanina yazar.
// Ayni id zaten varsa insert etmez, mevcut satiri gunceller (upsert).
//
// Transaction sarmalamasinin sebebi: yazma sirasinda bir hata olursa (ornegin
// N. kayitta beklenmedik bir sorun cikarsa), o ana kadar yazilmis satirlarin
// otomatik geri alinmasi (rollback) icin. Boylece "yarim senkronizasyon"
// durumu hic olusmuyor - bir organizasyonun repolari ya tamamen yazilir ya
// hicbiri yazilmaz. Kismi/tutarsiz veri kalma riski ortadan kalkiyor.
export function reposuKaydet(veriTabani: VeriTabani, donusturulmus: Repo[]): void {
  veriTabani.transaction((tx) => {
    for (const repo of donusturulmus) {
      tx.insert(repos)
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
  });
}

// Filtrelere uyan repolari veritabanindan, istenen siralamayla okur.
// Kosul/siralama kurma islemi (saf mantik) query-builder.ts'e, calistirma
// (yan etkili veritabani erisimi) burada.
export function reposuListele(veriTabani: VeriTabani, secenekler: ListSecenekleri) {
  const kosul = kosullariOlustur(secenekler);
  const siralama = siralamaOlustur(secenekler.sort);

  const sorgu = veriTabani.select().from(repos);
  return kosul
    ? sorgu.where(kosul).orderBy(siralama).all()
    : sorgu.orderBy(siralama).all();
}