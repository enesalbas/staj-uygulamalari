import { z } from "zod";

const ConfigSemasi = z.object({
  GITHUB_TOKEN: z.string().min(1, "GITHUB_TOKEN bos olamaz"),
  DB_PATH: z.string().default("repos.db"),
});

function configYukle() {
  const sonuc = ConfigSemasi.safeParse(process.env);

  if (!sonuc.success) {
    console.error("HATA: Ortam degiskenleri gecersiz.\n");
    sonuc.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    });
    process.exit(1);
  }

  return sonuc.data;
}

export const config = configYukle();