import { writeFile } from "fs/promises";

const CIKTI_YOLU = new URL("veri.sql", import.meta.url);

const MR_SAYISI = 30;
const GELISTIRICI_SAYISI = 11;

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

// Bir diziden rastgele eleman sec
function rastgeleSec<T>(dizi: T[]): T {
  return dizi[Math.floor(Math.random() * dizi.length)];
}

// min ve max arasinda rastgele tam sayi (ikisi de dahil)
function rastgeleSayi(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Bugunden "gunOnce" gun onceki tarihi ISO formatinda dondur
function gunOnceTarih(gunOnce: number): string {
  const milisaniye = gunOnce * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - milisaniye).toISOString();
}

// Bir degeri SQL'e uygun yaz: NULL tirnaksiz, sayi tirnaksiz, metin tirnakli
function sqlDeger(deger: string | number | null): string {
  if (deger === null) return "NULL";
  if (typeof deger === "number") return String(deger);
  return `'${deger.replace(/'/g, "''")}'`;
}

const mrSatirlari: string[] = [];
const commitSatirlari: string[] = [];
let commitId = 1;

for (let mrId = 1; mrId <= MR_SAYISI; mrId++) {
  const olusturmaGunu = rastgeleSayi(1, 90);
  const durum = rastgeleSec(DURUMLAR);
  const gelistiriciId = rastgeleSayi(1, GELISTIRICI_SAYISI);
  const baslik = `${rastgeleSec(ONEKLER)}: ${rastgeleSec(KONULAR)}`;

  // Sadece merge edilmis MR'larin merge tarihi olur, digerleri NULL
  // Merge tarihi olusturma tarihinden sonra olmali
  const mergeTarihi =
    durum === "merged" ? gunOnceTarih(rastgeleSayi(0, olusturmaGunu)) : null;

  mrSatirlari.push(
    `  (${mrId}, ${sqlDeger(baslik)}, ${gelistiriciId}, ` +
    `${sqlDeger(gunOnceTarih(olusturmaGunu))}, ${sqlDeger(mergeTarihi)}, ${sqlDeger(durum)})`
  );

  // Her MR'a 2-6 commit: gelistirici MR sahibiyle ayni, tarih MR'dan sonra
  const commitSayisi = rastgeleSayi(2, 6);

  for (let i = 0; i < commitSayisi; i++) {
    const commitGunu = rastgeleSayi(0, olusturmaGunu);

    commitSatirlari.push(
      `  (${commitId}, ${sqlDeger(rastgeleSec(COMMIT_MESAJLARI))}, ${gelistiriciId}, ` +
      `${mrId}, ${sqlDeger(gunOnceTarih(commitGunu))})`
    );
    commitId++;
  }
}

const sqlMetni = `-- Bu dosya veri-uret.ts tarafindan otomatik uretildi

INSERT INTO merge_requests (id, title, developer_id, created_at, merged_at, status) VALUES
${mrSatirlari.join(",\n")};

INSERT INTO commits (id, message, developer_id, merge_request_id, created_at) VALUES
${commitSatirlari.join(",\n")};
`;

await writeFile(CIKTI_YOLU, sqlMetni, "utf-8");
console.log(`${mrSatirlari.length} MR ve ${commitSatirlari.length} commit uretildi -> veri.sql`);