import { Command, InvalidArgumentError } from "commander";
import { db } from "../db/client.js";
import { reposuListele } from "../db/repository.js";

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
  .option("--sort <alan>", "siralama alani: stars veya name", (deger) => {
    if (deger !== "stars" && deger !== "name") {
      throw new InvalidArgumentError("Sadece 'stars' veya 'name' olabilir");
    }
    return deger;
  })
  .action((options: { language?: string; minStars?: number; sort?: "stars" | "name" }) => {
    const sonuclar = reposuListele(db, options);

    if (sonuclar.length === 0) {
      console.log("Kriterlere uyan repo bulunamadi.");
      return;
    }

    console.table(
      sonuclar.map((r) => ({ isim: r.name, dil: r.language, yildiz: r.stars, url: r.url }))
    );
    console.log(`\nToplam: ${sonuclar.length} repo`);
  });