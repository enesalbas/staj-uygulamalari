interface Islem {
  tarih: string;
  tur: string;
  tutar: number;
}

class BankaHesabi {
  readonly hesapNo: string;
  readonly sahibi: string;
  private _bakiye: number;
  private islemGecmisi: Islem[] = [];

  constructor(hesapNo: string, sahibi: string, baslangicBakiyesi: number) {
    this.hesapNo = hesapNo;
    this.sahibi = sahibi;
    this._bakiye = baslangicBakiyesi;
  }

  get bakiye(): number {
    return this._bakiye;
  }

  paraYatir(tutar: number): void {
    if (tutar <= 0) {
      throw new Error("Tutar pozitif olmali");
    }
    this._bakiye = this._bakiye + tutar;
    this.islemGecmisi.push({
      tarih: new Date().toISOString(),
      tur: "yatirma",
      tutar: tutar
    });
  }

  paraCek(tutar: number): void {
    if (tutar <= 0) {
      throw new Error("Tutar pozitif olmali");
    }
    if (tutar > this._bakiye) {
      throw new Error("Yetersiz bakiye. Mevcut bakiye: " + this._bakiye);
    }
    this._bakiye = this._bakiye - tutar;
    this.islemGecmisi.push({
      tarih: new Date().toISOString(),
      tur: "cekme",
      tutar: tutar
    });
  }

  ekstre(): void {
    console.log(this.hesapNo + " - " + this.sahibi + " ekstresi:");
    console.table(this.islemGecmisi);
    console.log("Bakiye: " + this._bakiye + " TL");
  }
}

function main(): void {
  const hesap1 = new BankaHesabi("TR001", "Enes Albas", 5000);
  const hesap2 = new BankaHesabi("TR002", "Ayse Yilmaz", 0);

  hesap1.paraYatir(1500);
  hesap1.paraCek(2000);
  hesap1.paraYatir(300);

  hesap2.paraYatir(1000);
  hesap2.paraCek(250);

  hesap1.ekstre();
  hesap2.ekstre();

  console.log("Hatali senaryolar:");

  try {
    hesap2.paraCek(999999);
  } catch (err) {
    console.error("Hata:", (err as Error).message);
  }

  try {
    hesap1.paraYatir(-100);
  } catch (err) {
    console.error("Hata:", (err as Error).message);
  }
}

main();