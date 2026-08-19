# RepoTakip

GitHub organizasyonlarinin repolarini ceken, dogrulayan, SQLite'ta saklayan, ozetleyen
ve JSON/CSV olarak disa aktaran bir komut satiri araci.

## Amac

Kendi organizasyonlarindaki repolari takip etmek isteyen gelistirici ekipleri icin:
"kacta kacimiz TypeScript yaziyor", "en cok yildiz alan repomuz hangisi" gibi sorulari
hizlica cevaplamak, ve bu bilgiyi rapor olarak (JSON/CSV) paylasabilmek.

Staj boyunca ogrenilen tum katmanlarin (HTTP istemcisi, veri dogrulama, ORM, CLI,
loglama, test, kod kalitesi) tek bir calisan uygulamada birlestirildigi bitirme
projesidir.

## Kurulum

```bash
git clone <bu-repo-url>
cd repotakip
npm install
cp .env.example .env
```

`.env` dosyasini acip GitHub kisisel erisim token'inizi ekleyin:

```
GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxxxxxxx
```

Token olusturmak icin: GitHub → Settings → Developer settings → Personal access
tokens → Generate new token. Sadece public repo okumak icin ekstra bir yetki
(scope) secmenize gerek yok, varsayilan izinler yeterli.

Veritabanini olusturun:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Komutlar

### fetch — repolari cek ve kaydet

```bash
npx tsx --env-file=.env main.ts fetch octokit
```

Cikti:
```
[13:41:15] info: Toplu senkronizasyon basladi {"orgSayisi":1,"esZamanliLimit":3}
[13:41:15] info: Senkronizasyon basladi {"org":"octokit"}
[13:41:16] info: Repolar cekildi {"org":"octokit","adet":71}
[13:41:16] info: Dogrulama tamamlandi {"org":"octokit","gecen":71,"elenen":0}
[13:41:16] info: Kayit tamamlandi {"org":"octokit","yazilan":71}
[13:41:16] info: Toplu senkronizasyon tamamlandi
```

Birden fazla organizasyon (aynı anda en fazla 3 tanesi islenir):
```bash
npx tsx --env-file=.env main.ts fetch octokit vercel expressjs
```

Ayni komut tekrar calistirilirsa veri ciftlenmez (upsert). Bir organizasyonun
kaydi tek bir transaction icinde yapilir - kayit sirasinda bir hata olursa o
organizasyonun hicbir kaydi veritabaninda kalmaz.

### list — filtreli listele

```bash
npx tsx --env-file=.env main.ts list --language TypeScript --min-stars 100 --sort name
```

Cikti:
```
┌─────────┬──────────────┬──────────────┬────────┬─────────────────────────────────────┐
│ (index) │ isim         │ dil          │ yildiz │ url                                 │
├─────────┼──────────────┼──────────────┼────────┼─────────────────────────────────────┤
│ 0       │ 'core.js'    │ 'TypeScript' │ 1282   │ 'https://github.com/octokit/core.js' │
│ 1       │ 'octokit.js' │ 'TypeScript' │ 7828   │ 'https://github.com/octokit/octokit.js' │
└─────────┴──────────────┴──────────────┴────────┴─────────────────────────────────────┘

Toplam: 2 repo
```

Option'lar:
- `--language <dil>` - sadece bu dildeki repolar
- `--min-stars <sayi>` - en az bu kadar yildizi olanlar
- `--sort <alan>` - `stars` (varsayilan, azalan) veya `name` (artan)

### stats — ozet rapor

```bash
npx tsx --env-file=.env main.ts stats
```

Cikti:
```
=== Dillere Gore Dagilim ===
TypeScript: 36 (%50.7)
JavaScript: 13 (%18.3)
Bilinmiyor: 10 (%14.1)
C#: 6 (%8.5)
Go: 3 (%4.2)
Ruby: 2 (%2.8)
Objective-C: 1 (%1.4)

=== En Yildizli 5 Repo ===
1. octokit.js (TypeScript) - 7828 yildiz
2. octokit.rb (Ruby) - 3949 yildiz
3. octokit.net (C#) - 2856 yildiz
4. octokit.objc (Objective-C) - 1823 yildiz
5. core.js (TypeScript) - 1282 yildiz

Toplam repo: 71
Son fetch: 2026-08-17T13:19:33.433Z
```

### export — disa aktar

```bash
npx tsx --env-file=.env main.ts export
npx tsx --env-file=.env main.ts export --format csv
npx tsx --env-file=.env main.ts export --format csv --output rapor.csv
```

Cikti:
```
71 repo export.json dosyasina yazildi.
```

Option'lar:
- `--format <bicim>` - `json` (varsayilan) veya `csv`
- `--output <dosya>` - ozel dosya adi (verilmezse formata gore `export.json`/`export.csv`)

JSON semasi:
```json
{
  "olusturmaTarihi": "2026-08-18T13:03:23.479Z",
  "toplamRepo": 71,
  "repolar": [
    { "id": 711976, "name": "octokit.js", "language": "TypeScript", "stars": 7828, "url": "...", "fetchedAt": "..." }
  ]
}
```

CSV formati:
```
id,name,language,stars,url,fetchedAt
711976,octokit.js,TypeScript,7828,https://github.com/octokit/octokit.js,2026-08-17T13:19:33.433Z
```

## Mimari

```
                     ┌─────────────┐
                     │   main.ts   │
                     └──────┬──────┘
                            │
        ┌──────────┬────────┴────────┬──────────┐
        │          │                 │          │
   ┌────▼───┐ ┌────▼───┐       ┌─────▼────┐ ┌───▼────┐
   │commands│ │commands│       │ commands │ │commands│
   │fetch.ts│ │list.ts │       │stats.ts  │ │export.ts│
   └────┬───┘ └────┬───┘       └─────┬────┘ └───┬────┘
        │          │                 │          │
   ┌────▼─────┐    │            ┌────▼──────────▼────┐
   │  api/    │    │            │        db/          │
   │github-   │    │            │  repository.ts      │
   │client.ts │    │            │  (kaydet, listele)   │
   └────┬─────┘    │            │  stats.ts (ozetle)   │
        │          └───────────►│  query-builder.ts    │
   ┌────▼─────┐                 │  (saf filtre/sort)   │
   │validation│                 │  csv.ts (formatla)   │
   │github-   │                 └──────────┬───────────┘
   │repo.ts   │                            │
   └──────────┘                       ┌────▼─────┐
                                       │db/client │
                                       │(baglanti)│
                                       └──────────┘

   Her katman config/ ve logging/'i kullanabilir (ok gostermedim, hepsi baglı):
   config/config.ts  → tum ortam degiskenlerini Zod ile dogrular
   logging/logger.ts → Winston, ortama gore format (dev: renkli, prod: JSON)
```

**Veri akisi (fetch komutu ornegi):**
```
kullanici (terminal)
   │  "fetch octokit"
   ▼
commands/fetch.ts        → argumanlari okur, Semafor ile es zamanliligi sinirlar
   │
   ▼
api/github-client.ts     → GitHub'a istek atar (timeout+retry+sayfalama), HAM veri doner
   │
   ▼
validation/github-repo.ts → ham veriyi Zod ile dogrular, GECERLI/GECERSIZ ayirir
   │
   ▼
db/repository.ts         → gecerli veriyi TEK TRANSACTION icinde upsert ile kaydeder
   │
   ▼
repos.db (SQLite)
```

Her katman tek bir sorumluluk tasir: `api/` sadece ag, `validation/` sadece dogrulama,
`db/` sadece veritabani, `commands/` sadece kullanici arayuzu (ic mantik icermez).

## Gelistirme

```bash
npm run format         # kodu bicimlendir (Prettier)
npm run lint            # statik analiz (ESLint)
npm test                 # testleri calistir (Vitest)
```

Tumu tek seferde:
```bash
npm run format && npm run lint && npm test
```

**31 test, 5 dosya:**
- `api/github-client.test.ts` (8) - timeout, retry (429/5xx/404/403), Retry-After, sayfalama
- `validation/github-repo.test.ts` (4) - dogrulama, donusturme
- `db/repository.test.ts` (9) - filtre, siralama, upsert, transaction rollback
- `db/stats.test.ts` (5) - dil dagilimi, yuzde, en yildizli, son fetch
- `db/csv.test.ts` (5) - CSV formatlama, kacis karakterleri

Butun `db/` fonksiyonlari veritabani baglantisini parametre olarak alir (dependency
injection) - testte gercek dosyaya dokunmadan, bellekteki (`:memory:`) bir
veritabaniyla calisirlar. `api/github-client.ts`'teki retry/timeout mantigi
`vi.stubGlobal("fetch", ...)` ile sahte ag cevaplari verilerek test edilir.

## Ortam Degiskenleri

| Degisken | Zorunlu mu | Varsayilan | Aciklama |
|---|---|---|---|
| `GITHUB_TOKEN` | Evet | - | GitHub kisisel erisim token'i |
| `DB_PATH` | Hayir | `repos.db` | SQLite veritabani dosya yolu |
| `LOG_LEVEL` | Hayir | `info` | `error` / `warn` / `info` / `debug` |
| `NODE_ENV` | Hayir | `development` | `development` / `production` |

## Hata Senaryolari

| Senaryo | Kullanici Ne Gorur |
|---|---|
| Token eksik/gecersiz | Program baslamadan durur: `HATA: Ortam degiskenleri gecersiz. GITHUB_TOKEN: ...` |
| Organizasyon bulunamadi (404) | `Organizasyon bulunamadi.` - kalici hata, tek denemede durur |
| GitHub hiz sinirina takildi (429 veya 403+`x-ratelimit-remaining:0`) | Toplam 3 deneme, `Retry-After`/`x-ratelimit-reset` basligina veya ustel geri cekilmeye gore beklenir |
| Sunucu hatasi (5xx) | Ayni sekilde toplam 3 deneme |
| Ag zaman asimi (10sn'de cevap yok) | `Istek zaman asimina ugradi (10000ms): <url>` |
| API'den gelen veri semaya uymuyor | O tek kayit elenir, digerleri kaydedilir, "X kayit gecti, Y kayit elendi" raporlanir |
| Kayit sirasinda yazma hatasi | O organizasyonun hicbir kaydi yazilmaz (transaction rollback) |
| `list`/`stats`/`export` calistirilirken veritabani bos | `Veritabaninda hic repo yok. Once 'repotakip fetch <org>' calistirin.` |
| `export --format` gecersiz deger | `error: option '--format <bicim>' argument '...' is invalid. Sadece 'json' veya 'csv' olabilir` |
| `export --output` gecersiz klasor | `HATA: Dosya yazilamadi: ENOENT: ...` |
| Ayni `fetch` komutu iki kez calistirilirsa | Veri ciftlenmez (upsert), kayit sayisi ayni kalir |

## Tasarim Dokumanlari

- `GEREKSINIMLER.md` (gun-24) - kapsam, hedef kullanici, basari olcutu, riskler
- `TASARIM.md` (haftasonu-5) - komut tasarimi, veritabani semasi, test plani, hata senaryolari