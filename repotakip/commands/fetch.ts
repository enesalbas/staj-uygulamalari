import { Command } from "commander";
import { logger } from "../logging/logger.js";
import { Semafor } from "../api/semafor.js";
import { tumRepolariCek } from "../api/github-client.js";
import { repolariDogrula, repoyaDonustur } from "../validation/github-repo.js";
import { db } from "../db/client.js";
import { reposuKaydet } from "../db/repository.js";

const ESZAMANLILIK_LIMITI = 3;

// Tek bir organizasyonu ucdan uca isler: cek (api) -> dogrula (validation) -> kaydet (db).
// Bu fonksiyon katmanlar arasindaki akisi yonetir, kendisi ne ag ne de SQL bilgisi tasir.
async function tekOrgSenkronizeEt(org: string): Promise<void> {
  logger.info("Senkronizasyon basladi", { org });

  const hamRepolar = await tumRepolariCek(org);
  logger.info("Repolar cekildi", { org, adet: hamRepolar.length });

  const { gecerliler, hatalar } = repolariDogrula(hamRepolar);
  logger.info("Dogrulama tamamlandi", {
    org,
    gecen: gecerliler.length,
    elenen: hatalar.length,
  });
  hatalar.forEach((h) => logger.warn("Kayit elendi", { org, index: h.index, sebep: h.sebep }));

  const donusturulmus = gecerliler.map(repoyaDonustur);
  reposuKaydet(db, donusturulmus);
  logger.info("Kayit tamamlandi", { org, yazilan: donusturulmus.length });
}

// CLI katmani: sadece argumanlari okur, es zamanliligi sinirlar ve
// yukaridaki servis fonksiyonunu cagirir. Ic mantik burada yok.
export const fetchCommand = new Command("fetch")
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

    await Promise.all(orgs.map((org) => semafor.calistir(() => tekOrgSenkronizeEt(org))));

    logger.info("Toplu senkronizasyon tamamlandi");
  });