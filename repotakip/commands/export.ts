import { writeFile } from "fs/promises";
import { Command, InvalidArgumentError } from "commander";
import { db } from "../db/client.js";
import { reposuListele } from "../db/repository.js";
import { csvUret } from "../db/csv.js";
import { logger } from "../logging/logger.js";

export const exportCommand = new Command("export")
  .description("Kayitli tum repolari bir dosyaya aktarir")
  .option("--format <bicim>", "cikti formati: json veya csv", (deger) => {
    if (deger !== "json" && deger !== "csv") {
      throw new InvalidArgumentError("Sadece 'json' veya 'csv' olabilir");
    }
    return deger;
  }, "json")
  .option("--output <dosya>", "cikti dosyasinin adi")
  .action(async (options: { format: "json" | "csv"; output?: string }) => {
    const repolar = reposuListele(db, {});

    if (repolar.length === 0) {
      console.log("Veritabaninda hic repo yok. Once 'repotakip fetch <org>' calistirin.");
      return;
    }

    const dosyaAdi = options.output ?? (options.format === "csv" ? "export.csv" : "export.json");

    let icerik: string;
    if (options.format === "csv") {
      icerik = csvUret(repolar);
    } else {
      icerik = JSON.stringify(
        {
          olusturmaTarihi: new Date().toISOString(),
          toplamRepo: repolar.length,
          repolar,
        },
        null,
        2
      );
    }

    try {
      await writeFile(dosyaAdi, icerik, "utf-8");
    } catch (err) {
      logger.error("Dosya yazma hatasi", { dosyaAdi, sebep: (err as Error).message });
      console.error(`HATA: Dosya yazilamadi: ${(err as Error).message}`);
      return;
    }

    console.log(`${repolar.length} repo ${dosyaAdi} dosyasina yazildi.`);
  });