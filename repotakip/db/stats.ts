import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { repos } from "./schema.js";

type VeriTabani = ReturnType<typeof drizzle>;

export interface DilDagilimi {
  language: string;
  adet: number;
  yuzde: number;
}

export interface OzetSonucu {
  toplamRepo: number;
  dilDagilimi: DilDagilimi[];
  enYildizli: { name: string; language: string | null; stars: number }[];
  sonFetch: string | null;
}

// Kayitli repolarin ozetini cikarir: dile gore dagilim (yuzdeyle), en yildizli
// 5 repo, ve son fetch zamani. Veritabani bossa toplamRepo 0, digerleri bos/null
// doner - caller (stats.ts) bu durumu ayrica kontrol edip kullaniciya mesaj basiyor.
export function reposuOzetle(veriTabani: VeriTabani): OzetSonucu {
  const tumKayitlar = veriTabani.select().from(repos).all();
  const toplamRepo = tumKayitlar.length;

  if (toplamRepo === 0) {
    return { toplamRepo: 0, dilDagilimi: [], enYildizli: [], sonFetch: null };
  }

  // Dile gore gruplama (Gun 2'deki reduce kalibi)
  const gruplar: Record<string, number> = {};
  for (const repo of tumKayitlar) {
    const dil = repo.language ?? "Bilinmiyor";
    gruplar[dil] = (gruplar[dil] ?? 0) + 1;
  }

  const dilDagilimi: DilDagilimi[] = Object.entries(gruplar)
    .map(([language, adet]) => ({
      language,
      adet,
      yuzde: Math.round((adet / toplamRepo) * 1000) / 10,
    }))
    .sort((a, b) => b.adet - a.adet);

  const enYildizli = veriTabani
    .select({ name: repos.name, language: repos.language, stars: repos.stars })
    .from(repos)
    .orderBy(desc(repos.stars))
    .limit(5)
    .all();

  const sonFetch = tumKayitlar.reduce<string | null>((enSon, repo) => {
    if (enSon === null || repo.fetchedAt > enSon) return repo.fetchedAt;
    return enSon;
  }, null);

  return { toplamRepo, dilDagilimi, enYildizli, sonFetch };
}