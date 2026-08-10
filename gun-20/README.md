# Gozlemlenebilir Uygulama

Staj Gun 20 odevi. Uygulamama Winston ile seviyeli loglama ekledim, config modulunu
(Gun 16) LOG_LEVEL ve NODE_ENV ile genisletttim.

## Neler Var

- **logger.ts**: Winston kurulumu, ortama gore (development/production) farkli format
- **config.ts**: Gun 16'dan genisletilmis hali - artik GITHUB_TOKEN, DB_PATH, LOG_LEVEL,
  NODE_ENV hepsi tek yerde, hepsi Zod ile dogrulanmis
- **lib.ts, commands/sync.ts**: dagilmis console.log/warn cagrilari logger'a cevrildi

## Kurulum ve Calistirma

```bash
npm install
cp .env.example .env   # GITHUB_TOKEN ekle
npx drizzle-kit generate
npx drizzle-kit migrate
```

```bash
npx tsx --env-file=.env main.ts sync octokit                       # development, varsayilan
NODE_ENV=production npx tsx --env-file=.env main.ts sync octokit   # production formati
LOG_LEVEL=warn npx tsx --env-file=.env main.ts sync octokit        # sadece warn/error gorunur
```

## Config'i Nasil Genisletttim

Gun 16'da config sadece iki alan doğruluyordu. Simdi dort:

```typescript
const ConfigSemasi = z.object({
  GITHUB_TOKEN: z.string().min(1, "GITHUB_TOKEN bos olamaz"),
  DB_PATH: z.string().default("repos.db"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
});
```

`LOG_LEVEL` icin `z.enum` kullandim - sadece bu dort degerden biri olabilir, baska bir
sey yazilirsa (`LOG_LEVEL=asdf` gibi) Zod reddediyor. Bu, config'in de dis dunyadan
gelen bir veri oldugu ve ayni disiplinle dogrulanmasi gerektigi fikrinin (Gun 16)
devami.

## Ortama Gore Farkli Format

```typescript
const gelisimFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const ekBilgi = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level}: ${message}${ekBilgi}`;
  })
);

const uretimFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: config.NODE_ENV === "production" ? uretimFormat : gelisimFormat,
  transports: [new winston.transports.Console()],
});
```

### Development ciktisi (renkli, kisa)

```
[14:48:09] info: Senkronizasyon basladi {"org":"octokit"}
[14:48:10] info: Repolar cekildi {"adet":71}
```

### Production ciktisi (yapilandirilmis JSON)

```json
{"level":"info","message":"Senkronizasyon basladi","org":"octokit","timestamp":"2026-08-10T11:48:31.955Z"}
{"adet":71,"level":"info","message":"Repolar cekildi","timestamp":"2026-08-10T11:48:33.069Z"}
```

## LOG_LEVEL Filtrelemesi

```bash
LOG_LEVEL=warn npx tsx --env-file=.env main.ts sync octokit
```

Bu komutu calistirinca cikti tamamen bos geldi - cunku senkronizasyon sirasinda
uretilen butun mesajlar `info` seviyesindeydi, ve `warn` esigi `info`'nun altindaki
hicbir seyi gostermiyor. Bu, `LOG_LEVEL`'in gercekten calistigini kanitliyor: uretimde
gurultuyu azaltmak icin `LOG_LEVEL=warn` veya `error` ayarlarsam, sadece gercekten
onemli olanlar gorunur.

## Neden console.log Uretimde Yeterli Degil?

`console.log`, gelistirme sirasinda (benim bilgisayarimda, ben okurken) gayet iyi
calisiyor. Ama bir uygulama gercekten calisir hale gelince (production'a alinca)
uc sorun cikiyor:

**1. Seviye yok.** `console.log("Repolar cekildi")` ile `console.log("HATA: token
gecersiz")` ayni fonksiyonla basiliyor - ikisi de ayni onemde gorunuyor. Gercek bir
sistemde binlerce log satiri arasinda "hangileri gercekten kritik" sorusunu
cevaplayamiyorsun.

**2. Filtrelenemiyor.** Production'da genelde sadece hata ve uyarilari gormek
istersin (gurultu az olsun), gelistirirken ise her seyi gormek istersin. `console.log`
bunu ayirt edemiyor - ya hep basar ya hic basmaz, ortama gore degismiyor.

**3. Aranabilir/yapilandirilmis degil.** Gercek sistemlerde loglar bir yerde toplanir
(sirket ici log paneli, CloudWatch, Datadog gibi araclar) ve "org=octokit olan tum
hatali senkronizasyonlari getir" gibi sorgular yapilir. Duz metin ("Repolar cekildi:
71") boyle sorgulanamaz. JSON formatinda, `{"message": "...", "org": "octokit",
"adet": 71}` seklinde olursa, her alan ayri ayri aranabilir ve filtrelenebilir hale
gelir.

Winston ile bunlarin ucunu de cozdum: seviye (`logger.info` / `logger.warn` /
`logger.error`), ortama gore format (development okunakli, production JSON), ve
yapilandirilmis ek bilgi (`{ org, adet }` gibi objeler).

## Sirlari Koda Gommenin Riski

Bir sir (token, sifre, API anahtari), koda dogrudan yazilirsa (`const TOKEN =
"ghp_abc123"` gibi) iki riski birden tasir:

**1. Git gecmisi kalicidir.** Kodu bir kere commit'lersen, sonradan silsen bile o
sir git gecmisinde kalir - biri eski bir commit'e bakip cikarabilir. Ozellikle
public bir repoda bu, sirri herkese acik hale getirmek demek.

**2. Sir, kodun her kopyasinda tasinir.** Kod baska bir bilgisayara kopyalanir,
baska bir gelistiriciyle paylasilir, bir CI/CD sistemine yuklenirse, sir de
onunla birlikte gider - kimin gordugunu kontrol edemezsin.

Ben bunu Gun 14'ten beri `.env` dosyasi ile onledim: gercek token sadece `.env`
icinde duruyor, bu dosya `.gitignore`'da oldugu icin git hicbir zaman gormuyor.
Kod icinde sadece `process.env.GITHUB_TOKEN` diye okunuyor - kodun kendisinde
gercek deger hic yok. `.env.example` ise hangi degiskenin gerektigini gosteren,
gercek deger icermeyen bir sablon olarak git'e ekleniyor.

Gun 16'da bunu bir adim ileri tasidim: token'in var olup olmadigini elle kontrol
etmek yerine, Zod ile dogruladim - token bos ya da eksikse program, hicbir istek
atmadan, en basta anlamli bir hatayla duruyor. Bugun de LOG_LEVEL ve NODE_ENV'i
ayni config modulune ekleyerek, tum ayarlarin (sir olan ve olmayan) tek, dogrulanmis
bir yerden okunmasini sagladim.

## Ogrendigim Kavramlar

- **Log seviyeleri (error/warn/info/debug)**: mesajlarin onem sirasina gore
  siniflandirilmasi
- **LOG_LEVEL filtrelemesi**: esigin altindaki seviyelerin hic basilmamasi
- **Ortama gore format**: development'ta insan icin okunakli, production'da
  makine icin JSON
- **Yapilandirilmis loglama (structured logging)**: mesaja ek bilgiyi obje olarak
  ekleyip aranabilir/filtrelenebilir hale getirme
- **Sirlarin koddan ayrilmasi**: .env + .gitignore + config dogrulamasi ucgeninin
  birlikte calismasi