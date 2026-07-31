import {writeFile} from "fs/promises";

const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("HATA: GITHUB_TOKEN ortam degiskeni tanimli degil.");
  console.error(".env dosyasi olusturup token'inizi ekleyin (.env.example'a bakin).");
  process.exit(1);
}

const BASE_URL = "https://api.github.com";

class GitHubApiHatasi extends Error {
  readonly durumKodu: number;

  constructor(durumKodu: number, aciklama: string) {
    super(aciklama);
    this.name = "GitHubApiHatasi";
    this.durumKodu = durumKodu;
  }
}

// Link basligindan "next" URL'ini cikarir, yoksa null doner
function sonrakiSayfaUrl(cevap: Response): string | null {
  const link = cevap.headers.get("link");

  if (!link) {
    return null;
  }

  // Basligi virgulle bolup rel="next" olani buluyoruz
  for (const parca of link.split(",")) {
    const [urlKismi, relKismi] = parca.split(";");

    if (relKismi?.includes('rel="next"')) {
      return urlKismi!.trim().slice(1, -1); // <...> isaretlerini at
    }
  }

  return null;
}

async function apiGet(url: string, yenidenDenendi = false): Promise<Response> {
  const cevap = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "staj-gun-14",
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

async function main() {
  const tumRepolar: any[] = [];
  let url: string | null = `${BASE_URL}/orgs/microsoft/repos?per_page=100`;
  let sayfaSayisi = 0;

  while (url) {
    const cevap = await apiGet(url);

    sayfaSayisi++;
    const repolar = await cevap.json();
    tumRepolar.push(...repolar);

    console.log(`Sayfa ${sayfaSayisi}: ${repolar.length} repo geldi (toplam: ${tumRepolar.length})`);

    url = sonrakiSayfaUrl(cevap);
  }

  console.log(`\nToplam sayfa: ${sayfaSayisi}`);
  console.log(`Toplam repo: ${tumRepolar.length}`);
  
  await writeFile("repolar.json", JSON.stringify(tumRepolar, null, 2), "utf-8");
  console.log(`\n${tumRepolar.length} repo repolar.json'a kaydedildi.`);
}

main();