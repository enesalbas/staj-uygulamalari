import { readFile } from "fs/promises";

const DOSYA_YOLU = new URL("calisanlar.json", import.meta.url);

interface Calisan {
  ad: string;
  takim: string;
  maas: number;
  iseGirisYili: number;
}

async function main() {
  try {
    const raw = await readFile(DOSYA_YOLU, "utf-8");
    const calisanlar: Calisan[] = JSON.parse(raw);

    const hedefTakim = "Backend";
    const backendCalisanlari = calisanlar.filter((c) => c.takim === hedefTakim);
    console.log(`${hedefTakim} takimindaki calisanlar:`);
    console.log(backendCalisanlari);

    const adListesi = calisanlar.map((c) => c.ad);
    console.log("Calisan adlari:");
    console.log(adListesi);

    const toplamMaas = calisanlar.reduce((toplam, c) => toplam + c.maas, 0);
    const ortalamaMaas = calisanlar.length > 0 ? toplamMaas / calisanlar.length : 0;
    const enYuksekMaasli = calisanlar.reduce<Calisan | null>(
      (en, c) => (en === null || c.maas > en.maas ? c : en),
      null
    );

    console.log("Ortalama maas:", ortalamaMaas);
    console.log("En yuksek maasli calisan:", enYuksekMaasli ?? "kayit yok");

    const takimSayilari = calisanlar.reduce((grup: Record<string, number>, c) => {
      grup[c.takim] = (grup[c.takim] ?? 0) + 1;
      return grup;
    }, {});
    console.log("Takima gore calisan sayilari:", takimSayilari);

    const yilaGoreSirali = [...calisanlar].sort((a, b) => a.iseGirisYili - b.iseGirisYili);
    console.log("Yila gore sirali liste:");
    console.log(yilaGoreSirali);

    const secilenler = calisanlar.filter((c) => c.iseGirisYili < 2020 && c.maas > ortalamaMaas);
    console.log("2020 oncesi ve ortalama ustu maasli calisanlar:");
    console.log(secilenler);
  } catch (err) {
    console.error("bir hata oldu:", (err as Error).message);
  }
}

main();