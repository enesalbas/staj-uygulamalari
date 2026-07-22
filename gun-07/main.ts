import { readFile, writeFile } from "fs/promises";

const DOSYA_YOLU = new URL("hesaplar.json", import.meta.url);

interface Islem {
  tarih: string;
  tur: string;
  tutar: number;
}

interface HesapKaydi {
  hesapNo: string;
  sahibi: string;
  bakiye: number;
  islemGecmisi: Islem[];
}

class BankaHesabi {
  readonly hesapNo: string;
  readonly sahibi: string;
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

  havaleYap(hedefHesap: BankaHesabi, tutar: number) {
  this.paraCek(tutar);
  hedefHesap.paraYatir(tutar);
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

  static fromJSON(veri: HesapKaydi): BankaHesabi {
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
type KayitHataKodu = "DOSYA_YOK" | "BOZUK_JSON" | "GECERSIZ_BICIM";

class KayitDosyasiHatasi extends Error{
    readonly kod: KayitHataKodu;

    constructor(kod: KayitHataKodu, mesaj:string, secenekler?: { cause?: unknown }){
        super(mesaj, secenekler);
        this.name="Kayıt Dosyası Hatası";
        this.kod = kod;
    }
}

function dosyaBulunamadiMi(err: unknown): boolean {
  return typeof err === "object" && err !== null
    && (err as NodeJS.ErrnoException).code === "ENOENT";
}

function hesapKaydiMi(veri: unknown): veri is HesapKaydi {
  if (typeof veri !== "object" || veri === null) {
    return false;
  }
  const kayit = veri as Record<string, unknown>;
  return typeof kayit.hesapNo === "string"
    && typeof kayit.sahibi === "string"
    && typeof kayit.bakiye === "number"
    && Array.isArray(kayit.islemGecmisi);
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
    // Sadece ENOENT gercekten "dosya yok" demek
    if (dosyaBulunamadiMi(err)) {
      throw new KayitDosyasiHatasi("DOSYA_YOK", "Kayit dosyasi bulunamadi.", { cause: err });
    }
    throw err;   // izin/disk hatasi
  }

  let veriler: unknown;

  try {
    veriler = JSON.parse(metin);
  } catch (err) {
    // Dosya var ama içeriği bozuk JSON
    throw new KayitDosyasiHatasi("BOZUK_JSON", "Kayit dosyasi gecerli JSON degil.", { cause: err });
  }

  if (!Array.isArray(veriler)) {
    throw new KayitDosyasiHatasi("GECERSIZ_BICIM", "Kayit dosyasi bir hesap dizisi icermeli.");
  }

  return veriler.map((veri: unknown, sira: number) => {
    if (!hesapKaydiMi(veri)) {
      throw new KayitDosyasiHatasi("GECERSIZ_BICIM", `${sira}. kayit hesap bicimine uymuyor.`);
    }
    return BankaHesabi.fromJSON(veri);
  });
}

async function main() {
  let hesaplar: BankaHesabi[];
  let kaydedebilir = true;   // dosya bozuksa uzerine yazmiyorum

  try {
  hesaplar = await yukle();
  console.log("Kayitli hesaplar yuklendi.");
} catch (err) {
  if (err instanceof KayitDosyasiHatasi && err.kod === "DOSYA_YOK") {
    console.log("Kayitli dosya yok, sifirdan baslaniyor.");
  } else if (err instanceof KayitDosyasiHatasi && err.kod === "BOZUK_JSON") {
    console.error("HATA: Kayit dosyasi bozuk! Icerigi gecerli JSON degil.");
    console.log("Yeni hesaplarla devam ediliyor (bozuk dosya korunuyor).");
    kaydedebilir = false;
  } else if (err instanceof KayitDosyasiHatasi && err.kod === "GECERSIZ_BICIM") {
    console.error("HATA: Kayit dosyasinin bicimi beklenenden farkli:", err.message);
    console.log("Yeni hesaplarla devam ediliyor (bozuk dosya korunuyor).");
    kaydedebilir = false;
  } else {
    // Beklenmedik hata, devam edersem veriyi ezerim
    console.error("Kayit dosyasi okunamadi, veri kaybi olmamasi icin cikiliyor:", err);
    process.exitCode = 1;
    return;
  }
  hesaplar = [
    new BankaHesabi("TR001", "Enes Albas", 5000),
    new BankaHesabi("TR002", "Ayse Yilmaz", 0)
  ];
}

  const hesap1 = hesaplar[0];
  const hesap2 = hesaplar[1];

  if (!hesap1 || !hesap2) {
    console.error("Kayit dosyasinda beklenen iki hesap yok, islem yapilmiyor.");
    process.exitCode = 1;
    return;
  }

  hesap1.paraYatir(1500);
  hesap2.paraYatir(1000);

  hesap1.ekstre();
  hesap2.ekstre();

  if (kaydedebilir) {
    await kaydet(hesaplar);
    console.log("Hesaplar basariyla kaydedildi.");

  } else {
    console.log("Bozuk dosyanin uzerine yazmamak icin kayit atlandi.");
  }


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
console.log("\n--- Havale ---");
hesap1.havaleYap(hesap2, 500);
hesap1.ekstre();
hesap2.ekstre();

await kaydet(hesaplar);
console.log("Havale sonrasi kaydedildi.");
}
main();