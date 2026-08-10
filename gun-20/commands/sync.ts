import { logger } from "../logger.js";
import { Command } from "commander";
import { sql } from "drizzle-orm";
import {
  db,
  BASE_URL,
  apiGet,
  sonrakiSayfaUrl,
  GitHubRepoSemasi,
  repoyaDonustur,
} from "../lib.js";
import { repos } from "../schema.js";

async function tumRepolariCek(org: string) {
  const tumRepolar: unknown[] = [];
  let url: string | null = `${BASE_URL}/orgs/${org}/repos?per_page=100`;

  while (url) {
    const cevap = await apiGet(url);
    const repolar = await cevap.json();
    tumRepolar.push(...repolar);
    url = sonrakiSayfaUrl(cevap);
  }

  return tumRepolar;
}

function repolariDogrula(hamRepolar: unknown[]) {
  const gecerliler: ReturnType<typeof GitHubRepoSemasi.parse>[] = [];
  const hatalar: { index: number; sebep: string }[] = [];

  hamRepolar.forEach((repo, index) => {
    const sonuc = GitHubRepoSemasi.safeParse(repo);
    if (sonuc.success) {
      gecerliler.push(sonuc.data);
    } else {
      const sebep = sonuc.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      hatalar.push({ index, sebep });
    }
  });

  return { gecerliler, hatalar };
}

function kaydet(donusturulmus: ReturnType<typeof repoyaDonustur>[]) {
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

export const syncCommand = new Command("sync")
  .description("Bir GitHub organizasyonunun repolarini cekip veritabanina kaydeder")
  .argument("<org>", "senkronize edilecek GitHub organizasyon adi")
  .action(async (org: string) => {
   logger.info("Senkronizasyon basladi", { org });

    const hamRepolar = await tumRepolariCek(org);
    logger.info("Repolar cekildi", { adet: hamRepolar.length });
    const { gecerliler, hatalar } = repolariDogrula(hamRepolar);
    logger.info("Dogrulama tamamlandi", { gecen: gecerliler.length, elenen: hatalar.length });
    
    if (hatalar.length > 0) {
      console.log("\nElenen kayitlar:");
     hatalar.forEach((h) => logger.warn("Kayit elendi", { index: h.index, sebep: h.sebep }));    }

    const donusturulmus = gecerliler.map(repoyaDonustur);
    kaydet(donusturulmus);
    logger.info("Kayit tamamlandi", { yazilan: donusturulmus.length }); 
   
  });