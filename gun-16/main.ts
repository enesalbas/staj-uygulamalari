import { z } from "zod";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import { repos } from "./schema.js";
import { config } from "./config.js";

const orgAdi = process.argv[2];

if (!orgAdi) {
  console.error("Kullanim: npx tsx main.ts <organizasyon-adi>");
  process.exit(1);
}

const BASE_URL = "https://api.github.com";

const sqlite = new Database(config.DB_PATH);
const db = drizzle(sqlite);

// ---- Dogrulama semasi ----

const GitHubRepoSemasi = z.object({
  id: z.number(),
  name: z.string().min(1),
  language: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  html_url: z.url(),
});

function repolariDogrula(hamRepolar: unknown[]) {
  const gecerliler: z.infer<typeof GitHubRepoSemasi>[] = [];
  const hatalar: { index: number; sebep: string }[] = [];

  hamRepolar.forEach((repo, index) => {
    const sonuc = GitHubRepoSemasi.safeParse(repo);

    if (sonuc.success) {
      gecerliler.push(sonuc.data);
    } else {
      const sebep = sonuc.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      hatalar.push({ index, sebep });
    }
  });

  return { gecerliler, hatalar };
}

// ---- Hata tipi ----

class GitHubApiHatasi extends Error {
  readonly durumKodu: number;

  constructor(durumKodu: number, aciklama: string) {
    super(aciklama);
    this.name = "GitHubApiHatasi";
    this.durumKodu = durumKodu;
  }
}

// ---- Sayfalama ----

function sonrakiSayfaUrl(cevap: Response): string | null {
  const link = cevap.headers.get("link");

  if (!link) {
    return null;
  }

  for (const parca of link.split(",")) {
    const [urlKismi, relKismi] = parca.split(";");

    if (relKismi?.includes('rel="next"')) {
      return urlKismi!.trim().slice(1, -1);
    }
  }

  return null;
}

// ---- Ortak istek yardimcisi ----

async function apiGet(url: string, yenidenDenendi = false): Promise<Response> {
  const cevap = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "staj-gun-16",
    },
  });

  if (cevap.ok) {
    return cevap;
  }

  if (cevap.status === 429) {
    if (yenidenDenendi) {
      throw new GitHubApiHatasi(429, "Hiz sinirina takildi, yeniden deneme de basarisiz.");
    }
    console.warn("429 alindi, 5 saniye beklenip tekrar denenecek...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return apiGet(url, true);
  }

  const mesajlar: Record<number, string> = {
    401: "Token gecersiz veya suresi dolmus.",
    404: "Organizasyon bulunamadi.",
    500: "GitHub sunucu hatasi.",
  };

  const mesaj = mesajlar[cevap.status] ?? `Beklenmeyen durum kodu: ${cevap.status}`;
  throw new GitHubApiHatasi(cevap.status, mesaj);
}

// ---- 1. Cek ----

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

// ---- 2. Donustur ----

function repoyaDonustur(repo: z.infer<typeof GitHubRepoSemasi>) {
  return {
    id: repo.id,
    name: repo.name,
    language: repo.language,
    stars: repo.stargazers_count,
    url: repo.html_url,
    fetchedAt: new Date().toISOString(),
  };
}

// ---- 3. Kaydet (upsert) ----

function kaydet(repolar: ReturnType<typeof repoyaDonustur>[]) {
  for (const repo of repolar) {
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

// ---- 4. Ozet ----

function ozetYazdir() {
  const tumKayitlar = db.select().from(repos).all();

  console.log(`\nToplam repo: ${tumKayitlar.length}`);

  const dilDagilimi: Record<string, number> = {};
  for (const repo of tumKayitlar) {
    const dil = repo.language ?? "Bilinmiyor";
    dilDagilimi[dil] = (dilDagilimi[dil] ?? 0) + 1;
  }

  console.log("\nDillere gore dagilim:");
  console.table(dilDagilimi);

  const enYildizlilar = [...tumKayitlar]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 5);

  console.log("\nEn yildizli 5 repo:");
  console.table(
    enYildizlilar.map((r) => ({ isim: r.name, yildiz: r.stars, dil: r.language }))
  );
}

// ---- main ----

async function main() {
  console.log(`"${orgAdi}" organizasyonunun repolari cekiliyor...`);

  const hamRepolar = await tumRepolariCek(orgAdi);
console.log(`${hamRepolar.length} repo cekildi.`);

const { gecerliler, hatalar } = repolariDogrula(hamRepolar);

  console.log(`\n${gecerliler.length} kayit gecti, ${hatalar.length} kayit elendi.`);

  if (hatalar.length > 0) {
    console.log("\nElenen kayitlar:");
    hatalar.forEach((h) => {
      console.log(`  [${h.index}] ${h.sebep}`);
    });
  }

  const donusturulmus = gecerliler.map(repoyaDonustur);
  kaydet(donusturulmus);
  console.log("\nGecerli kayitlar veritabanina yazildi.");

  ozetYazdir();
}

main();