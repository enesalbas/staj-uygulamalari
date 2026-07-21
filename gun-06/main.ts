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

class GecersizTutarHatasi extends Error{
    constructor(mesaj:string){
        super(mesaj);
        this.name="Gecersiz Tutar Hatasi";
    }
}
class KayitDosyasiHatasi extends Error{
    constructor(mesaj:string){
        super(mesaj);
        this.name="Kayıt Dosyası Hatası";
    }
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
    // Dosya okunamadı — hiç yok (ilk çalıştırma)
    throw new KayitDosyasiHatasi("DOSYA_YOK");
  }

  try {
    const veriler = JSON.parse(metin);
    return veriler.map((veri: any) => BankaHesabi.fromJSON(veri));
  } catch (err) {
    // Dosya var ama içeriği bozuk JSON
    throw new KayitDosyasiHatasi("BOZUK_JSON");
  }
}

async function main() {
  let hesaplar: BankaHesabi[];

  try {
  hesaplar = await yukle();
  console.log("Kayitli hesaplar yuklendi.");
} catch (err) {
  if (err instanceof KayitDosyasiHatasi && err.message === "DOSYA_YOK") {
    console.log("Kayitli dosya yok, sifirdan baslaniyor.");
  } else if (err instanceof KayitDosyasiHatasi && err.message === "BOZUK_JSON") {
    console.error("HATA: Kayit dosyasi bozuk! Icerigi gecerli JSON degil.");
    console.log("Yeni hesaplarla devam ediliyor (bozuk dosya korunuyor).");
  } else {
    console.error("Beklenmeyen hata:", (err as Error).message);
  }
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

try {
  hesap2.paraCek(999999);
} catch (err) {
  if (err instanceof YetersizBakiyeHatasi) {
    console.error("Bakiye yetersiz:", err.message);
  } else if (err instanceof GecersizTutarHatasi) {
    console.error("Gecersiz tutar:", err.message);
  } else {
    console.error("Beklenmeyen hata:", (err as Error).message);
  }
}

try {
  hesap1.paraYatir(-100);
} catch (err) {
  if (err instanceof YetersizBakiyeHatasi) {
    console.error("Bakiye yetersiz:", err.message);
  } else if (err instanceof GecersizTutarHatasi) {
    console.error("Gecersiz tutar:", err.message);
  } else {
    console.error("Beklenmeyen hata:", (err as Error).message);
  }
}
}
main();