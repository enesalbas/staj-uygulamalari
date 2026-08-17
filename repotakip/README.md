# RepoTakip

GitHub organizasyonlarinin repolarini cekip dogrulayan, SQLite'ta saklayan ve
listeleyen bir komut satiri araci. Bitirme projesi.

## Durum (Gun 25)

Iskelet + `fetch` + `list` komutlari tamamlandi ve test edildi. `stats` ve `export`
Gun 26'da eklenecek.

## Kurulum

```bash
npm install
cp .env.example .env   # GITHUB_TOKEN ekle
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Komutlar

```bash
repotakip fetch <org> [org2] [org3...]
repotakip list [--language <dil>] [--min-stars <sayi>] [--sort stars|name]
```

## Gelistirme

```bash
npm run lint    # (Gun 26'da eklenecek)
npm test        # vitest run
```

## Mimari

```
api/         - GitHub istemcisi (timeout, akilli retry, sayfalama, es zamanlilik siniri)
validation/  - Zod semasi, dogrulama, donusturme
db/          - Drizzle semasi, sorgu kurma (saf), veri erisimi (DI ile)
commands/    - CLI komutlari (ince, sadece yonlendirir)
config/      - Zod ile dogrulanmis ortam degiskenleri
logging/     - Winston, ortama gore format
```

Detaylar icin `TASARIM.md`'ye (haftasonu-5) bakin.

## Test Edilebilirlik

`db/repository.ts`'teki fonksiyonlar veritabani baglantisini parametre olarak alir
(dependency injection) - bu sayede testte gercek dosyaya dokunmadan, bellekteki
(`:memory:`) bir veritabaniyla test edilebilirler.

`api/github-client.ts`'teki retry/timeout mantigi, `vi.stubGlobal("fetch", ...)`
ile sahte ag cevaplari verilerek test edilir - gercek GitHub'a hic istek atmadan.

17 test, 3 test dosyasi (`api/`, `validation/`, `db/`).