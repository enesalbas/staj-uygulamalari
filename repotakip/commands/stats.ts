import { Command } from "commander";
import { db } from "../db/client.js";
import { reposuOzetle } from "../db/stats.js";

// CLI katmani: ozet mantiginin kendisi db/stats.ts'te (reposuOzetle), burada
// sadece cagrilip cikti formatlaniyor.
export const statsCommand = new Command("stats")
  .description(
    "Kayitli repolarin ozetini gosterir: dil dagilimi, en yildizli repolar, son fetch zamani"
  )
  .action(() => {
    const ozet = reposuOzetle(db);

    if (ozet.toplamRepo === 0) {
      console.log("Veritabaninda hic repo yok. Once 'repotakip fetch <org>' calistirin.");
      return;
    }

    console.log("=== Dillere Gore Dagilim ===");
    ozet.dilDagilimi.forEach((d) => {
      console.log(`${d.language}: ${d.adet} (%${d.yuzde})`);
    });

    console.log("\n=== En Yildizli 5 Repo ===");
    ozet.enYildizli.forEach((r, i) => {
      console.log(`${i + 1}. ${r.name} (${r.language ?? "Bilinmiyor"}) - ${r.stars} yildiz`);
    });

    console.log(`\nToplam repo: ${ozet.toplamRepo}`);
    console.log(`Son fetch: ${ozet.sonFetch}`);
  });
