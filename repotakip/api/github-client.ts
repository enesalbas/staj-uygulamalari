import { config } from "../config/config.js";
import { logger } from "../logging/logger.js";

export const BASE_URL = "https://api.github.com";

const ZAMAN_ASIMI_MS = 10000;
const MAX_DENEME = 3;

export class GitHubApiHatasi extends Error {
  readonly durumKodu: number;
  constructor(durumKodu: number, aciklama: string) {
    super(aciklama);
    this.name = "GitHubApiHatasi";
    this.durumKodu = durumKodu;
  }
}
// Cevaptaki Link basligindan "next" (sonraki sayfa) URL'ini cikarir.
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
function bekle(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch'i AbortController ile sarar; ZAMAN_ASIMI_MS icinde cevap gelmezse
// istegi zorla keser ve anlamli bir hata firlatir.
async function fetchZamanAsimliyla(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ZAMAN_ASIMI_MS);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "repotakip",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new GitHubApiHatasi(0, `Istek zaman asimina ugradi (${ZAMAN_ASIMI_MS}ms): ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
// 429 (hiz siniri) ve 5xx (sunucu hatasi) gecici sayilir, yeniden denemeye deger.
// 401/404 gibi kalici hatalarda tekrar denemenin anlami yok.
function geciciHataMi(durumKodu: number): boolean {
  return durumKodu === 429 || durumKodu >= 500;
}

export async function apiGet(url: string, deneme = 1): Promise<Response> {
  const cevap = await fetchZamanAsimliyla(url);

  if (cevap.ok) {
    return cevap;
  }

  if (geciciHataMi(cevap.status)) {
    if (deneme >= MAX_DENEME) {
      logger.error("Gecici hata, tum denemeler tukendi", {
        durumKodu: cevap.status,
        toplamDeneme: MAX_DENEME,
        url,
      });
      throw new GitHubApiHatasi(cevap.status, `${MAX_DENEME} denemede de basarisiz oldu.`);
    }

    const bekleMs = 1000 * 2 ** (deneme - 1);
    logger.warn("Gecici hata, yeniden deneniyor", {
      durumKodu: cevap.status,
      deneme,
      bekleMs,
      url,
    });
    await bekle(bekleMs);
    return apiGet(url, deneme + 1);
  }

  logger.error("Kalici hata, yeniden denenmiyor", { durumKodu: cevap.status, url });

  const mesajlar: Record<number, string> = {
    401: "Token gecersiz veya suresi dolmus.",
    404: "Organizasyon bulunamadi.",
  };
  throw new GitHubApiHatasi(
    cevap.status,
    mesajlar[cevap.status] ?? `Beklenmeyen durum kodu: ${cevap.status}`
  );
}
// Bir organizasyonun tum repolarini, sayfalamayi takip ederek ceker.
// Donen deger dogrulanmamis ham veridir; dogrulama validation katmaninin isi.
export async function tumRepolariCek(org: string): Promise<unknown[]> {
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