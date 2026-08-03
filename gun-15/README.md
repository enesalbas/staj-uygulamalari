# Uctan Uca Veri Hatti

Staj Gun 15 odevi. Gun 14'teki GitHub istemcisini veritabanina bagladim: cek -> donustur -> kaydet.

## Neler Var

- **schema.ts**: repos tablosu (id, name, language, stars, url, fetched_at)
- **main.ts**: tum akis - GitHub'dan repo cekme, donusturme, upsert ile kaydetme, ozet basma
- **.env.example**: token sablonu

## Kurulum

```bash
npm install
cp .env.example .env   # .env icine kendi GITHUB_TOKEN'ini yaz
npm run db:generate
npm run db:migrate
```

## Calistirma

```bash
npm run sync -- <organizasyon-adi>
```

Ornek:
```bash
npm run sync -- octokit
```

## Upsert (2. madde)

Ayni komutu iki kez calistirdim, ikisinde de sonuc ayni:

```
1. calistirma -> Toplam repo: 71
2. calistirma -> Toplam repo: 71
```

Satir sayisi degismedi, yani veri ciftlenmedi. Bunu Drizzle'in `onConflictDoUpdate` metoduyla
sagladim:

```typescript
db.insert(repos)
  .values(repo)
  .onConflictDoUpdate({
    target: repos.id,
    set: {
      name: sql`excluded.name`,
      stars: sql`excluded.stars`,
      // ...
    },
  })
  .run();
```

`target: repos.id` -> ayni id'li bir kayit zaten varsa, yeni satir eklemek yerine mevcut
satiri guncelle. `excluded` SQLite'in ozel bir tablosu, eklemeye calistigin yeni degerleri
temsil ediyor. Yani "id ayniysa, yeni gelen degerlerle uzerine yaz" demis oluyorum.

`id` olarak GitHub'in kendi repo id'sini kullandim (kendi urettigim bir sayi degil), cunku
"ayni repo" oldugunu anlamanin tek yolu bu - isim degisebilir ama GitHub id'si sabit kalir.

## Veri Hatti (Pipeline)

```
GitHub API -> tumRepolariCek() -> repoyaDonustur() -> kaydet() -> ozetYazdir()
    cek            (ham veri)      (semaya uydur)      (upsert)      (rapor)
```

`repoyaDonustur`, GitHub'in kendi alan adlarini (`stargazers_count`, `html_url`) bizim
semamizin alan adlarina (`stars`, `url`) ceviriyor - bu "donustur" adimi.

## Ogrendigim Kavramlar

- **Upsert**: "insert veya update" - ayni kayit varsa guncelle, yoksa ekle
- **excluded tablosu**: SQLite'ta cakisma aninda yeni degerlere erisim
- **process.argv**: komut satiri argumanlarini okuma, organizasyon adini disaridan almak
- **Cek -> donustur -> kaydet**: gercek veri hatlarinin en temel deseni