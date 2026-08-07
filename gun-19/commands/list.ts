import { Command, InvalidArgumentError } from "commander";
import { db } from "../lib.js";
import { repos } from "../schema.js";
import { kosullariOlustur } from "../filtre.js";

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
    const kosul = kosullariOlustur(options);

    const sonuclar = kosul
      ? db.select().from(repos).where(kosul).all()
      : db.select().from(repos).all();

    if (sonuclar.length === 0) {
      console.log("Kriterlere uyan repo bulunamadi.");
      return;
    }

    console.table(
      sonuclar.map((r) => ({ isim: r.name, dil: r.language, yildiz: r.stars, url: r.url }))
    );
    console.log(`\nToplam: ${sonuclar.length} repo`);
  });