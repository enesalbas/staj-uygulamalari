import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { developers, mergeRequests, commits } from "./schema.js";

const sqlite = new Database("staj.db");
const db = drizzle(sqlite);

// Onceki veriyi temizle (seed tekrar calisirsa cift veri olmasin)
db.delete(commits).run();
db.delete(mergeRequests).run();
db.delete(developers).run();

// Yardimcilar (Gun 9'dan tanidik)
function rastgeleSec<T>(dizi: T[]): T {
  return dizi[Math.floor(Math.random() * dizi.length)]!;
}

function rastgeleSayi(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gunOnceTarih(gunOnce: number): string {
  const milisaniye = gunOnce * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - milisaniye).toISOString();
}

const ISIMLER = [
  "Ayse Yilmaz", "Mehmet Demir", "Zeynep Kaya", "Ali Can", "Fatma Sahin",
  "Emre Aydin", "Elif Celik", "Burak Arslan", "Deniz Koc", "Selin Yildiz",
  "Kerem Ozturk", "Ece Aksoy"
];
const TAKIMLAR = ["Backend", "Frontend", "DevOps", "QA"];

const gelistiriciVerileri = ISIMLER.map((isim, index) => ({
  id: index + 1,
  name: isim,
  email: index % 3 === 0 ? null : `${isim.split(" ")[0]!.toLowerCase()}@example.com`,
  team: rastgeleSec(TAKIMLAR),
}));

db.insert(developers).values(gelistiriciVerileri).run();
console.log(`${gelistiriciVerileri.length} developer eklendi`);

const ONEKLER = ["Feature", "Fix", "Refactor", "Chore", "Docs"];
const KONULAR = [
  "login sayfasi", "kullanici profili", "odeme ekrani", "bildirim sistemi",
  "arama filtresi", "raporlama modulu", "veritabani migrasyonu", "API endpoint",
  "hata yonetimi", "test coverage"
];
const DURUMLAR = ["merged", "merged", "merged", "open", "closed"];
const COMMIT_MESAJLARI = [
  "ilk implementasyon", "kod duzenlemesi", "hata duzeltmesi",
  "testler eklendi", "review sonrasi duzeltmeler", "degisken isimleri duzeltildi",
  "gereksiz kod temizlendi", "dokumantasyon guncellendi", "edge case eklendi",
  "performans iyilestirmesi"
];

const MR_SAYISI = 30;
const gelistiriciSayisi = gelistiriciVerileri.length;

const mrVerileri = [];
const commitVerileri = [];
let commitId = 1;

for (let mrId = 1; mrId <= MR_SAYISI; mrId++) {
  const olusturmaGunu = rastgeleSayi(1, 90);
  const durum = rastgeleSec(DURUMLAR);
  const gelistiriciId = rastgeleSayi(1, gelistiriciSayisi);

  mrVerileri.push({
    id: mrId,
    title: `${rastgeleSec(ONEKLER)}: ${rastgeleSec(KONULAR)}`,
    developerId: gelistiriciId,
    createdAt: gunOnceTarih(olusturmaGunu),
    mergedAt: durum === "merged" ? gunOnceTarih(rastgeleSayi(0, olusturmaGunu)) : null,
    status: durum,
  });

  const commitSayisi = rastgeleSayi(2, 6);
  for (let i = 0; i < commitSayisi; i++) {
    commitVerileri.push({
      id: commitId,
      message: rastgeleSec(COMMIT_MESAJLARI),
      developerId: gelistiriciId,
      mergeRequestId: mrId,
      createdAt: gunOnceTarih(rastgeleSayi(0, olusturmaGunu)),
    });
    commitId++;
  }
}

db.insert(mergeRequests).values(mrVerileri).run();
db.insert(commits).values(commitVerileri).run();

console.log(`${mrVerileri.length} MR ve ${commitVerileri.length} commit eklendi`);