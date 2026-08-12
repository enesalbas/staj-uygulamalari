# Parcalari Birlestir

Staj Gun 22 odevi. Dort haftadir ayri ayri yazilan parcalari (istemci, dogrulama,
veritabani, CLI, log, test) net katmanlara ayirdim, tekrarlari temizledim.

## Klasor Yapisi

```
gun-22/
  api/
    github-client.ts   - GitHub'a istek atma, sayfalama, timeout, retry
    semafor.ts         - es zamanlilik siniri
  validation/
    github-repo.ts     - Zod semasi, dogrulama, donusturme
  db/
    schema.ts           - Drizzle tablo tanimi
    client.ts           - veritabani baglantisi
    query-builder.ts    - saf filtre mantigi (db baglantisina bagimli degil)
    repository.ts       - kaydetme/okuma (kaydet + upsert + listele)
  commands/
    sync.ts             - CLI: sync komutu (ince, sadece yonlendirir)
    list.ts              - CLI: list komutu (ince, sadece yonlendirir)
  config/
    config.ts           - tum ortam degiskenleri, Zod ile dogrulanmis
  logging/
    logger.ts           - Winston logger, ortama gore format
  main.ts                - giris noktasi, komutlari birlestirir
```

## Mimari Diyagrami

```
                     ┌─────────────┐
                     │   main.ts   │
                     └──────┬──────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
       ┌──────▼──────┐            ┌───────▼──────┐
       │ commands/    │            │ commands/    │
       │ sync.ts      │            │ list.ts      │
       └──────┬──────┘            └───────┬──────┘
              │                            │
   ┌──────────┼──────────┐                 │
   │          │          │                 │
┌──▼───┐  ┌───▼────┐  ┌──▼─────┐      ┌────▼─────┐
│ api/ │  │validat- │  │  db/   │◄─────┤   db/    │
│      │  │ ion/    │  │reposi- │      │repository│
└──┬───┘  └────┬────┘  │tory.ts │      └────┬─────┘
   │           │        └───┬────┘           │
   │           │            │                │
   │           │       ┌────▼────┐      ┌────▼─────┐
   │           │       │db/client│      │  db/     │
   │           │       └────┬────┘      │query-    │
   │           │            │           │builder.ts│
   │           │            │           └──────────┘
   │           │            │
┌──▼───────────▼────────────▼──┐
│      config/config.ts         │  ← tum katmanlarin okudugu tek kaynak
└───────────────┬───────────────┘
                 │
         ┌───────▼────────┐
         │ logging/logger  │  ← her katman loglayabilir
         └─────────────────┘
```

**Veri akisi (sync komutu ornegi):**

```
kullanici (terminal)
   │  "sync octokit"
   ▼
commands/sync.ts        → argumanlari okur, Semafor ile es zamanliligi sinirlar
   │
   ▼
api/github-client.ts    → GitHub'a istek atar (timeout+retry ile), HAM veri doner
   │
   ▼
validation/github-repo.ts → ham veriyi Zod ile dogrular, GECERLI/GECERSIZ ayirir
   │
   ▼
db/repository.ts        → gecerli veriyi upsert ile kaydeder
   │
   ▼
repos.db (SQLite)
```

Her ok, verinin **tek yonde** aktigini gosteriyor: `commands` hicbir zaman dogrudan
SQL yazmiyor, `api` hicbir zaman veritabanina dokunmuyor, `validation` hicbir zaman
ag istegi atmiyor. Her katman sadece kendinden bir alt katmani cagiriyor.

## Nasil Calistirilir

```bash
npm install
cp .env.example .env
npx drizzle-kit generate
npx drizzle-kit migrate
npx tsx --env-file=.env main.ts sync octokit
npx tsx --env-file=.env main.ts list --language TypeScript
npx vitest run
```

## Temizledigim Tekrarlar

### 1. tumRepolariCek ve repolariDogrula, CLI dosyasinin disina cikti

Onceden (gun-21) bu iki fonksiyon `commands/sync.ts` icindeydi - yani ag mantigi ve
dogrulama mantigi, CLI komutunun kendisiyle karismisti. Simdi:

- `tumRepolariCek` → `api/github-client.ts`'e tasindi (ag/sayfalama mantigi oldugu icin)
- `repolariDogrula` → `validation/github-repo.ts`'e tasindi (dogrulama mantigi oldugu icin)

`commands/sync.ts` artik bu ikisini **cagiriyor**, kendi icinde tanimlamiyor. Ödevin
"CLI iş mantığı içermesin" kuralı bu sekilde saglandi.

### 2. Filtre mantigi (kosullariOlustur), db baglantisindan ayrildi

Bunu refactor ederken gercek bir sorunla karsilastim: `kosullariOlustur`'u ilk once
`db/repository.ts`'e koymustum, ama o dosya `db/client.ts`'i (dolayisiyla `config`'i)
import ettigi icin, testi calistirdigimda token yokken program kapaniyordu - aynen
Gun 19'da yasadigim "bagimliligin sizmasi" sorunu.

Cozum: `kosullariOlustur`'u, veritabani baglantisina hic ihtiyaci olmayan ayri bir
dosyaya (`db/query-builder.ts`) cikardim. `db/repository.ts` hem `client.ts`'i hem
`query-builder.ts`'i kullaniyor, ama `query-builder.ts`'in kendisi tek basina, config
gerekmeden test edilebiliyor.

### 3. toJSON/fromJSON tarzi tekrarlar zaten yoktu

Gun 15-21 arasinda zaten ORM (Drizzle) kullandigim icin, Gun 6'daki gibi elle
serialize/deserialize yazma tekrari hic olusmamisti. Bu odevde asil temizlenen
tekrar, katmanlar arasi sinir ihlalleriydi (CLI'in ag/dogrulama isi yapmasi),
kod tekrari degil.

## Testlerin Durumu

Refactor sonrasi testleri yeni dosya konumlarina tasidim:

- `lib.test.ts` → `validation/github-repo.test.ts` (import: `./lib.js` → `./github-repo.js`)
- `filtre.test.ts` + `upsert.test.ts` → `db/repository.test.ts` (birlestirildi, import:
  `./filtre.js` → `./query-builder.js`)

9 test de refactor sonrasi hala geciyor:

```
✓ validation/github-repo.test.ts (4 tests)
✓ db/repository.test.ts (5 tests)
Tests  9 passed (9)
```

## Ogrendigim Kavramlar

- **Katmanli mimari**: her klasorun tek bir sorumlulugu olmasi (api = ag, validation =
  dogrulama, db = veri, commands = kullanici arayuzu)
- **Ince CLI katmani**: komut dosyalarinin is mantigi tasimamasi, sadece alt katmanlari
  cagirmasi
- **Bagimliligin sizmasi (tekrar)**: saf mantigin, gereksiz yere bir baglantiya/config'e
  bagimli hale gelmesi ve bunun testi nasil zorlastirdigi
- **Repository deseni**: veriye erisimin tek bir dosyadan (kapidan) gecmesi
- **Mimari diyagram**: verinin katmanlar arasinda nasil, hangi yonde aktigini
  gorsellestirme