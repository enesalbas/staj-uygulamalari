# RepoTakip

GitHub organizasyonlarinin repolarini cekip dogrulayan, SQLite'ta saklayan, ozetleyen
ve disari aktarabilen bir komut satiri araci.

## Amac

Kendi organizasyonlarindaki repolari takip etmek isteyen gelistirici ekipleri icin:
"kacta kacimiz TypeScript yaziyor", "en cok yildiz alan repomuz hangisi" gibi sorulari
hizlica cevaplamak, ve bu bilgiyi rapor olarak (JSON) paylasabilmek.

## Kurulum

```bash
git clone <repo-url>
cd repo-takip
npm install
cp .env.example .env
```

`.env` icine GitHub kisisel erisim token'inizi ekleyin:

```
GITHUB_TOKEN=github_pat_...
```

Token olusturmak icin: GitHub Settings > Developer settings > Personal access
tokens. Public repo okumak icin ekstra yetki gerekmiyor.

Veritabanini hazirlayin:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Komutlar

### Repolari cek ve kaydet

```bash
repo-cli fetch <org> [org2] [org3...]
```

Bir veya birden fazla GitHub organizasyonunun public repolarini ceker, dogrular,
veritabanina kaydeder. Ayni komut tekrar calistirilirsa veri ciftlenmez (upsert).

### Repolari listele

```bash
repo-cli list
repo-cli list --language TypeScript
repo-cli list --min-stars 100
```

Kayitli repolari, istege bagli dil ve minimum yildiz filtreleriyle listeler.

### Ozet istatistik

```bash
repo-cli stats
```

Dile gore dagilimi ve en yildizli 5 repoyu gosterir.

### JSON'a aktar

```bash
repo-cli export
repo-cli export --out rapor.json
```

Kayitli tum repo verisini bir JSON dosyasina yazar.

## Gelistirme

```bash
npm run format        # kodu bicimlendir
npm run lint           # statik analiz
npm test               # testleri calistir
```

## Ortam Degiskenleri

| Degisken | Zorunlu mu | Varsayilan | Aciklama |
|---|---|---|---|
| `GITHUB_TOKEN` | Evet | - | GitHub kisisel erisim token'i |
| `DB_PATH` | Hayir | `repos.db` | SQLite veritabani dosya yolu |
| `LOG_LEVEL` | Hayir | `info` | `error` / `warn` / `info` / `debug` |
| `NODE_ENV` | Hayir | `development` | `development` / `production` |

## Mimari

Katmanli yapi: `api/` (GitHub istemcisi) → `validation/` (Zod dogrulama) →
`db/` (Drizzle ORM) → `commands/` (CLI). Detaylar icin `TASARIM.md`'ye bakin.