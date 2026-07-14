import { readFile } from "fs/promises";

interface Calisan {
  ad: string;
  takim: string;
  maas: number;
  iseGirisYili: number;
}

async function main() {
  try {
    const raw = await readFile("calisanlar.json", "utf-8");
    const calisanlar: Calisan[] = JSON.parse(raw);

    const hedefTakim = "Backend";
    const backendCalisanlari = calisanlar.filter((c) => c.takim === hedefTakim);
    console.log(`${hedefTakim} takimindaki calisanlar:`);
    console.log(backendCalisanlari);

    const adListesi = calisanlar.map((c) => c.ad);
    console.log("Calisan adlari:");
    console.log(adListesi);

    const toplamMaas = calisanlar.reduce((toplam, c) => toplam + c.maas, 0);
    const ortalamaMaas = toplamMaas / calisanlar.length;
    const enYuksekMaasli = calisanlar.reduce((en, c) => (c.maas > en.maas ? c : en));

    console.log("Ortalama maas:", ortalamaMaas);
    console.log("En yuksek maasli calisan:", enYuksekMaasli);

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