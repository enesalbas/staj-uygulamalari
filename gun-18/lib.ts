import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { z } from "zod";
import { config } from "./config.js";
import { repos } from "./schema.js";

export const sqlite = new Database(config.DB_PATH);
export const db = drizzle(sqlite);

export const BASE_URL = "https://api.github.com";

export class GitHubApiHatasi extends Error {
  readonly durumKodu: number;
  constructor(durumKodu: number, aciklama: string) {
    super(aciklama);
    this.name = "GitHubApiHatasi";
    this.durumKodu = durumKodu;
  }
}

export function sonrakiSayfaUrl(cevap: Response): string | null {
  const link = cevap.headers.get("link");
  if (!link) return null;
  for (const parca of link.split(",")) {
    const [urlKismi, relKismi] = parca.split(";");
    if (relKismi?.includes('rel="next"')) {
      return urlKismi!.trim().slice(1, -1);
    }
  }
  return null;
}

export async function apiGet(url: string, yenidenDenendi = false): Promise<Response> {
  const cevap = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "staj-gun-18",
    },
  });

  if (cevap.ok) return cevap;

  if (cevap.status === 429) {
    if (yenidenDenendi) {
      throw new GitHubApiHatasi(429, "Hiz sinirina takildi, yeniden deneme de basarisiz.");
    }
    console.warn("429 alindi, 5 saniye beklenip tekrar denenecek...");
    await new Promise((r) => setTimeout(r, 5000));
    return apiGet(url, true);
  }

  const mesajlar: Record<number, string> = {
    401: "Token gecersiz veya suresi dolmus.",
    404: "Organizasyon bulunamadi.",
    500: "GitHub sunucu hatasi.",
  };
  throw new GitHubApiHatasi(cevap.status, mesajlar[cevap.status] ?? `Beklenmeyen durum kodu: ${cevap.status}`);
}

export const GitHubRepoSemasi = z.object({
  id: z.number(),
  name: z.string().min(1),
  language: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  html_url: z.url(),
});

export function repoyaDonustur(repo: z.infer<typeof GitHubRepoSemasi>) {
  return {
    id: repo.id,
    name: repo.name,
    language: repo.language,
    stars: repo.stargazers_count,
    url: repo.html_url,
    fetchedAt: new Date().toISOString(),
  };
}