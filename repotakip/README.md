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

Bu adimlarin **hepsi sirayla ve eksiksiz** takip edilmeli - herhangi biri atlanirsa
sonraki komutlar anlamli olmayan hatalar verir (asagida her adimin nedeni aciklandi).

```bash
git clone <bu-repo-url>
cd repotakip
npm install
```

### Windows'ta better-sqlite3 kurulum sorunu (bilinen kisit)

`better-sqlite3`, C++ ile yazilmis, derlenmesi gereken (native) bir pakettir.
Bazi Windows + yeni Node surumu (24+) kombinasyonlarinda `npm install`,
"Visual Studio bulunamadi" hatasi verebilir - onceden derlenmis (prebuilt)
bir ikili dosyanin indirilememesinden kaynaklanir.

Karsilasirsaniz once sunu deneyin (cogu zaman yeterli oluyor):
```bash
npm cache clean --force
npm install better-sqlite3
```

Hala sorun devam ederse iki secenek var:
1. **Node'u LTS surumune dusurmek** (nvm-windows ile `nvm install 22.11.0` `nvm use 22.11.0`)
2. **Visual Studio Build Tools kurmak** ("Desktop development with C++" workload'iyla,
   https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### 2. Ortam degiskenlerini ayarlayin

```bash
cp .env.example .env
```

`.env` dosyasini acip **gercek GitHub token'inizi** ekleyin (bu adim atlanirsa
her komut "GITHUB_TOKEN: Invalid input" hatasiyla en basta durur):

```
GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxxxxxxx
```

Token olusturmak icin: GitHub → Settings → Developer settings → Personal access
tokens → Generate new token. Sadece public repo okumak icin ekstra bir yetki
(scope) secmenize gerek yok, varsayilan izinler yeterli.

### 3. Veritabanini olusturun (ZORUNLU - atlanirsa "no such table: repos" hatasi alirsiniz)

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Bu iki komut calistirilmadan `fetch` komutu calisir ama veriyi kaydederken
hata verir.

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

**Windows/PowerShell notu:** `--env-file=.env` bazi PowerShell surumlerinde
".env: not found" hatasi verirse, tirnak icine alarak deneyin:
```powershell
npx tsx "--env-file=.env" main.ts fetch octokit
```

Ayni komut tekrar calistirilirsa veri ciftlenmez (upsert). Bir organizasyonun
kaydi tek bir transaction icinde yapilir - kayit sirasinda bir hata olursa o
organizasyonun hicbir kaydi veritabaninda kalmaz.

### list — filtreli listele

```bash
npx tsx --env-file=.env main.ts list --language TypeScript --sort name
```

Cikti (gercek calistirmadan, 36 TypeScript reposundan ilk birkaci):
```
┌─────────┬──────────────┬──────────────┬────────┬───────────────────────────────────┐
│ (index) │ isim         │ dil          │ yildiz │ url                                 │
├─────────┼──────────────┼──────────────┼────────┼───────────────────────────────────┤
│ 0       │ 'action.js'  │ 'TypeScript' │ 212    │ 'https://github.com/octokit/action.js' │
│ 1       │ 'app.js'     │ 'TypeScript' │ 190    │ 'https://github.com/octokit/app.js'    │
...
└─────────┴──────────────┴──────────────┴────────┴───────────────────────────────────┘

Toplam: 36 repo
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
1. octokit.js (TypeScript) - 7829 yildiz
2. octokit.rb (Ruby) - 3949 yildiz
3. octokit.net (C#) - 2857 yildiz
4. octokit.objc (Objective-C) - 1823 yildiz
5. core.js (TypeScript) - 1283 yildiz

Toplam repo: 71
Son fetch: 2026-08-19T11:21:05.545Z
```

### export — disa aktar

```bash
npx tsx --env-file=.env main.ts export
npx tsx --env-file=.env main.ts export --format csv
npx tsx --env-file=.env main.ts export --format csv --output rapor.csv
```

Cikti:
```
71 repo export.csv dosyasina yazildi.
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
    { "id": 711976, "name": "octokit.js", "language": "TypeScript", "stars": 7829, "url": "...", "fetchedAt": "..." }
  ]
}
```

CSV formati:
```
id,name,language,stars,url,fetchedAt
711976,octokit.js,TypeScript,7829,https://github.com/octokit/octokit.js,2026-08-19T11:21:05.545Z
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

Bu proje hem Mac hem Windows'ta sifirdan klonlanip test edilmistir.

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
| Veritabani migrate edilmemis | `SqliteError: no such table: repos` - kurulumda `drizzle-kit generate`+`migrate` adimi atlandiginda |
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