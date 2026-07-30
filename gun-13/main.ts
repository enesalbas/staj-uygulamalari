interface Kullanici {
  id: number;
  name: string;
  username: string;
  email: string;
}

interface Gonderi {
  id: number;
  userId: number;
  title: string;
  body: string;
}

interface Yorum {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

class ApiHatasi extends Error {
  readonly durumKodu: number;
  readonly url: string;

  constructor(durumKodu: number, url: string) {
    super(`API istegi basarisiz: ${durumKodu} - ${url}`);
    this.name = "ApiHatasi";
    this.durumKodu = durumKodu;
    this.url = url;
  }
}

const BASE_URL = "https://jsonplaceholder.typicode.com";

async function apiGet<T>(yol: string): Promise<T> {
  const cevap = await fetch(`${BASE_URL}${yol}`);

  if (!cevap.ok) {
    throw new ApiHatasi(cevap.status, yol);
  }

  return cevap.json() as Promise<T>;
}

async function kullanicilariGetir() {
  console.log("\n=== 1. Kullanici listesi ===");

  const kullanicilar = await apiGet<Kullanici[]>("/users");

  console.table(
    kullanicilar.map((k) => ({
      id: k.id,
      isim: k.name,
      kullaniciAdi: k.username,
      email: k.email,
    }))
  );
}
async function siraliYorumlar(kullaniciId: number) {
  console.log("\n=== 2-3a. Yorumlar (SIRALI) ===");

  const gonderiler = await apiGet<Gonderi[]>(`/posts?userId=${kullaniciId}`);
  console.log(`${gonderiler.length} gonderi bulundu`);

  const baslangic = Date.now();

  const sonuclar: { gonderi: string; yorumSayisi: number }[] = [];

  for (const gonderi of gonderiler) {
    const yorumlar = await apiGet<Yorum[]>(`/posts/${gonderi.id}/comments`);
    sonuclar.push({
      gonderi: gonderi.title.slice(0, 30),
      yorumSayisi: yorumlar.length,
    });
  }

  const sure = Date.now() - baslangic;

  console.table(sonuclar);
  console.log(`Sirali sure: ${sure} ms`);

  return sure;
}

async function paralelYorumlar(kullaniciId: number) {
  console.log("\n=== 3b. Yorumlar (PARALEL) ===");

  const gonderiler = await apiGet<Gonderi[]>(`/posts?userId=${kullaniciId}`);

  const baslangic = Date.now();

  const istekler = gonderiler.map(async (gonderi) => {
    const yorumlar = await apiGet<Yorum[]>(`/posts/${gonderi.id}/comments`);
    return {
      gonderi: gonderi.title.slice(0, 30),
      yorumSayisi: yorumlar.length,
    };
  });

  const sonuclar = await Promise.all(istekler);

  const sure = Date.now() - baslangic;

  console.table(sonuclar);
  console.log(`Paralel sure: ${sure} ms`);

  return sure;
}
async function gonderiOlusturVeGuncelle() {
  console.log("\n=== 4. POST ve PATCH ===");

  // POST: yeni gonderi olustur
  const postCevap = await fetch(`${BASE_URL}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Staj Gun 13",
      body: "Asenkron programlama ve HTTP istemcisi",
      userId: 1,
    }),
  });

  if (!postCevap.ok) {
    throw new ApiHatasi(postCevap.status, "/posts");
  }

  const yeniGonderi = await postCevap.json();
  console.log("POST sonucu (durum:", postCevap.status, "):");
  console.log(yeniGonderi);

  // PATCH: mevcut gonderiyi guncelle
  const patchCevap = await fetch(`${BASE_URL}/posts/1`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Guncellenmis baslik" }),
  });

  if (!patchCevap.ok) {
    throw new ApiHatasi(patchCevap.status, "/posts/1");
  }

  const guncellenmis = await patchCevap.json();
  console.log("\nPATCH sonucu (durum:", patchCevap.status, "):");
  console.log(guncellenmis);
}

async function hataSenaryosu() {
  console.log("\n=== 5. Hata senaryosu ===");

  try {
    await apiGet<Gonderi>("/posts/999999");
  } catch (err) {
    if (err instanceof ApiHatasi) {
      console.error(`ApiHatasi yakalandi -> durum: ${err.durumKodu}, yol: ${err.url}`);
    } else {
      console.error("Beklenmeyen hata:", err);
    }
  }
}

async function main() {
    await kullanicilariGetir();
    await siraliYorumlar(1);
    await paralelYorumlar(1);
    await gonderiOlusturVeGuncelle();
    await hataSenaryosu();
}
main();
