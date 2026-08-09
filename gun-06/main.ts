import { readFile, writeFile } from "fs/promises";

const DOSYA_YOLU = new URL("hesaplar.json", import.meta.url);

interface Islem {
  tarih: string;
  tur: string;
  tutar: number;
}

class BankaHesabi {
  hesapNo: string;
  sahibi: string;
  private bakiye: number;
  private islemGecmisi: Islem[] = [];

  constructor(hesapNo: string, sahibi: string, baslangicBakiyesi: number) {
    this.hesapNo = hesapNo;
    this.sahibi = sahibi;
    this.bakiye = baslangicBakiyesi;
  }

  paraYatir(tutar: number) {
    if (tutar <= 0) {
      throw new GecersizTutarHatasi("Tutar pozitif olmali");
    }
    this.bakiye = this.bakiye + tutar;
    this.islemGecmisi.push({
      tarih: new Date().toISOString(),
      tur: "yatirma",
      tutar: tutar
    });
  }

  paraCek(tutar: number) {
    if (tutar <= 0) {
      throw new GecersizTutarHatasi("Tutar pozitif olmali");
    }
    if (tutar > this.bakiye) {
      throw new YetersizBakiyeHatasi("Yetersiz bakiye. Mevcut bakiye: " + this.bakiye);
    }
    this.bakiye = this.bakiye - tutar;
    this.islemGecmisi.push({
      tarih: new Date().toISOString(),
      tur: "cekme",
      tutar: tutar
    });
  }

  bakiyeGoster() {
    return this.bakiye;
  }

  ekstre() {
    console.log(this.hesapNo + " - " + this.sahibi + " ekstresi:");
    console.table(this.islemGecmisi);
    console.log("Bakiye: " + this.bakiye + " TL");
  }

  toJSON() {
    return {
      hesapNo: this.hesapNo,
      sahibi: this.sahibi,
      bakiye: this.bakiye,
      islemGecmisi: this.islemGecmisi
    };
  }

  static fromJSON(veri: any): BankaHesabi {
    const hesap = new BankaHesabi(veri.hesapNo, veri.sahibi, veri.bakiye);
    hesap.islemGecmisi = veri.islemGecmisi;
    return hesap;
  }
}

class YetersizBakiyeHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "Yetersiz Bakiye Hatasi";
  }
}

class GecersizTutarHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "Gecersiz Tutar Hatasi";
  }
}

class KayitDosyasiHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "Kayit Dosyasi Hatasi";
  }
}

// REFACTOR: iki catch blogunda tekrar eden instanceof zinciri
// buraya tek bir yere cikarildi (Duplicate Code kokusu duzeltildi).
function hataMesajiUret(err: unknown): string {
  if (err instanceof YetersizBakiyeHatasi) {
    return `Bakiye yetersiz: ${err.message}`;
  }
  if (err instanceof GecersizTutarHatasi) {
    return `Gecersiz tutar: ${err.message}`;
  }
  return `Beklenmeyen hata: ${(err as Error).message}`;
}

async function kaydet(hesaplar: BankaHesabi[]) {
  const metin = JSON.stringify(hesaplar, null, 2);
  await writeFile(DOSYA_YOLU, metin, "utf-8");
}

async function yukle(): Promise<BankaHesabi[]> {
  let metin: string;

  try {
    metin = await readFile(DOSYA_YOLU, "utf-8");
  } catch (err) {
    throw new KayitDosyasiHatasi("Kayit dosyasi bulunamadi.");
  }

  try {
    const veriler = JSON.parse(metin);
    return veriler.map((veri: any) => BankaHesabi.fromJSON(veri));
  } catch (err) {
    throw new KayitDosyasiHatasi("Kayit dosyasi gecerli JSON degil.");
  }
}

async function main() {
  let hesaplar: BankaHesabi[];

  try {
    hesaplar = await yukle();
    console.log("Kayitli hesaplar yuklendi.");
  } catch (err) {
    console.log("Kayitli hesap bulunamadi, yeni hesaplar olusturuluyor.");
    hesaplar = [
      new BankaHesabi("TR001", "Enes Albas", 5000),
      new BankaHesabi("TR002", "Ayse Yilmaz", 0)
    ];
  }

  const hesap1 = hesaplar[0];
  const hesap2 = hesaplar[1];

  hesap1.paraYatir(1500);
  hesap2.paraYatir(1000);

  hesap1.ekstre();
  hesap2.ekstre();

  await kaydet(hesaplar);
  console.log("Hesaplar kaydedildi.");

  console.log("\n--- Hatali senaryolar ---");

  // REFACTOR: iki catch blogu artik tek satirlik hataMesajiUret cagrisi
  // kullaniyor, oncesinde her biri ayni 6 satirlik if/else zincirini
  // tekrarliyordu.
  try {
    hesap2.paraCek(999999);
  } catch (err) {
    console.error(hataMesajiUret(err));
  }

  try {
    hesap1.paraYatir(-100);
  } catch (err) {
    console.error(hataMesajiUret(err));
  }
}

main();