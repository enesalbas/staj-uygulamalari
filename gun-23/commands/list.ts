import { Command, InvalidArgumentError } from "commander";
import { reposuListele } from "../db/repository.js";

// CLI katmani: option'lari okur, sorguyu db katmanina devreder, sonucu basar.
// Filtre mantiginin kendisi (SQL kosullari) burada degil, db/repository.ts'te.
export const listCommand = new Command("list")
  .description("Veritabanindaki repolari listeler")
  .option("--language <dil>", "sadece belirtilen dildeki repolari goster")
  .option("--min-stars <sayi>", "en az bu kadar yildizi olan repolari goster", (deger) => {
    const sayi = parseInt(deger, 10);
    if (Number.isNaN(sayi)) {
      throw new InvalidArgumentError("Sayisal bir deger olmali, ornegin --min-stars 100");
    }
    return sayi;
  })
  .action((options: { language?: string; minStars?: number }) => {
    const sonuclar = reposuListele(options);

    if (sonuclar.length === 0) {
      console.log("Kriterlere uyan repo bulunamadi.");
      return;
    }

    console.table(
      sonuclar.map((r) => ({ isim: r.name, dil: r.language, yildiz: r.stars, url: r.url }))
    );
    console.log(`\nToplam: ${sonuclar.length} repo`);
  });
