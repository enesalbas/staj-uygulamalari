import { readFile } from "fs/promises";

const DOSYA_YOLU = new URL("satislar.json", import.meta.url);

interface Satis {
  urun: string;
  kategori: string;
  sehir: string;
  tutar: number;
  tarih: string;
}

async function main() {
  try {
    const raw = await readFile(DOSYA_YOLU, "utf-8");
    const satislar: Satis[] = JSON.parse(raw);

    // 1. madde: kategoriye göre ciro
    const kategoriCirolari = satislar.reduce((grup: Record<string, number>, s) => {
      grup[s.kategori] = (grup[s.kategori] ?? 0) + s.tutar;
      return grup;
    }, {});

    console.log("Kategoriye gore toplam ciro:");
    console.table(kategoriCirolari);

    // 2. madde: şehir bazında ortalama veri toplama
    const sehirVerileri = satislar.reduce(
      (grup: Record<string, { toplam: number; adet: number }>, s) => {
        const mevcut = grup[s.sehir] ?? { toplam: 0, adet: 0 };
        grup[s.sehir] = {
          toplam: mevcut.toplam + s.tutar,
          adet: mevcut.adet + 1
        };
        return grup;
      },
      {}
    );

    const sehirOrtalamalari = Object.entries(sehirVerileri)
      .map(([sehir, veri]) => ({
        sehir: sehir,
        ortalama: veri.toplam / veri.adet
      }))
      .sort((a, b) => b.ortalama - a.ortalama);

    console.log("Sehir bazinda ortalama sepet tutari (azalan):");
    console.table(sehirOrtalamalari);

    //3.madde en çok ciro yapan ilk 3 ürün
    const urunCiro = satislar.reduce((grup: Record<string, number>, s) => {
      grup[s.urun] = (grup[s.urun] ?? 0) + s.tutar;
      return grup;
    }, {});

    const enCokCiroYapan = Object.entries(urunCiro)
      .map(([urun, ciro]) => ({
        urun: urun,
        ciro: ciro
      }))
      .sort((a, b) => b.ciro - a.ciro)
      .slice(0, 3);

    console.log("En cok ciro yapan ilk 3 urun:");
    console.table(enCokCiroYapan);

    //4. madde kategori içinde pahalı ürün
    const kategoriEnPahali = satislar.reduce((grup: Record<string, Satis>, s) => {
      const mevcut = grup[s.kategori];
      if (!mevcut || s.tutar > mevcut.tutar) {
        grup[s.kategori] = s;
      }
      return grup;
    }, {});

    console.log("Her kategorideki en pahali urun:");
    console.table(Object.values(kategoriEnPahali));

    //5. madde aya göre indirgeyip grupla
    const ayaGoreCiro = satislar.reduce((grup: Record<string, number>, s) => {
      const ay = s.tarih.slice(0, 7);
      grup[ay] = (grup[ay] ?? 0) + s.tutar;
      return grup;
    }, {});

    console.log("Aya gore ciro dagilimi:");
    console.table(ayaGoreCiro);

    //6. madde İstanbuldaki elektronik satışların tutarına göre azalan ilk 5i
    const istanbulSatis = satislar
      .filter((s) => s.sehir === "İstanbul" && s.kategori === "Elektronik")
      .sort((a, b) => b.tutar - a.tutar)
      .slice(0, 5);

    console.log("Istanbul'daki elektronik satislarinin tutara gore azalan ilk 5'i:");
    console.table(istanbulSatis);
  } catch (err) {
    console.error("bir hata oldu:", (err as Error).message);
  }
}

main();
