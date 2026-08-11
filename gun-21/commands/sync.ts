import { Command } from "commander";
import { sql } from "drizzle-orm";
import { logger } from "../logger.js";
import { Semafor } from "../semafor.js";
import {
  db,
  BASE_URL,
  apiGet,
  sonrakiSayfaUrl,
  GitHubRepoSemasi,
  repoyaDonustur,
} from "../lib.js";
import { repos } from "../schema.js";

const ESZAMANLILIK_LIMITI = 3;

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
      const sebep = sonuc.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
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

// Tek bir organizasyonu ucdan uca isleyen fonksiyon: cek -> dogrula -> kaydet.
// Birden fazla org verildiginde bu fonksiyon, Semafor araciligiyla
// es zamanli olarak (ama sinirli sayida) cagrilir.
async function tekOrgSenkronizeEt(org: string) {
  logger.info("Senkronizasyon basladi", { org });

  const hamRepolar = await tumRepolariCek(org);
  logger.info("Repolar cekildi", { org, adet: hamRepolar.length });

  const { gecerliler, hatalar } = repolariDogrula(hamRepolar);
  logger.info("Dogrulama tamamlandi", {
    org,
    gecen: gecerliler.length,
    elenen: hatalar.length,
  });

  hatalar.forEach((h) =>
    logger.warn("Kayit elendi", { org, index: h.index, sebep: h.sebep })
  );

  const donusturulmus = gecerliler.map(repoyaDonustur);
  kaydet(donusturulmus);
  logger.info("Kayit tamamlandi", { org, yazilan: donusturulmus.length });
}

export const syncCommand = new Command("sync")
  .description(
    "Bir veya birden fazla GitHub organizasyonunun repolarini cekip veritabanina kaydeder"
  )
  .argument(
    "<orgs...>",
    "senkronize edilecek GitHub organizasyon adlari (bosluklu, birden fazla verilebilir)"
  )
  .action(async (orgs: string[]) => {
    const semafor = new Semafor(ESZAMANLILIK_LIMITI);

    logger.info("Toplu senkronizasyon basladi", {
      orgSayisi: orgs.length,
      esZamanliLimit: ESZAMANLILIK_LIMITI,
    });

    await Promise.all(
      orgs.map((org) => semafor.calistir(() => tekOrgSenkronizeEt(org)))
    );

    logger.info("Toplu senkronizasyon tamamlandi");
  });