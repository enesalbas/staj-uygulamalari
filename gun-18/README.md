# Ilk CLI Uygulamam

Staj Gun 18 odevi. Bu haftanin parcalarini (Gun 15'in veri hatti, Gun 16'nin dogrulamasi)
Commander.js ile bir CLI araci altinda topladim: `sync` ve `list` komutlari.

## Neler Var

- **main.ts**: CLI'nin giris noktasi, komutlari birlestirir
- **commands/sync.ts**: veri hattini calistiran komut
- **commands/list.ts**: veritabanini filtreli listeleyen komut
- **lib.ts**: iki komutun da kullandigi ortak kod (db baglantisi, apiGet, dogrulama semasi)
- **config.ts**: Gun 16'dan, ortam degiskeni dogrulama modulu
- **schema.ts**: Gun 11'den, repos tablosu

## Kurulum ve Calistirma

```bash
npm install
cp .env.example .env   # GITHUB_TOKEN'ini ekle
npx drizzle-kit generate
npx drizzle-kit migrate
```

```bash
npx tsx --env-file=.env main.ts sync <organizasyon-adi>
npx tsx --env-file=.env main.ts list [--language <dil>] [--min-stars <sayi>]
```

## Neden Kodu commands/ ve lib.ts Diye Ayirdim?

`sync` ve `list` ikisi de veritabanina baglanmasi, GitHub'a istek atmasi gereken
komutlar. Bu ortak ihtiyaci `lib.ts`'e topladim ki iki komut dosyasina ayni kodu
kopyalamayayim - biri degisince digerini unutma riski olurdu.

`main.ts` ise kasten cok az is yapiyor, sadece komutlari birlestiriyor:

```typescript
program.addCommand(syncCommand);
program.addCommand(listCommand);
program.parse();
```

Bu, `git` gibi araclarin calisma sekli: ana komut kendisi bir sey yapmaz, alt
komutlara yonlendirir. Yarin yeni bir komut (`remove`, `stats` gibi) eklemek
istersem, `commands/` altina yeni bir dosya eklerim, `main.ts`'e sadece iki
satir eklerim.

## sync Komutu

```bash
npx tsx --env-file=.env main.ts sync octokit
```

```
"octokit" organizasyonunun repolari cekiliyor...
71 repo cekildi.

71 kayit gecti, 0 kayit elendi.

Gecerli kayitlar veritabanina yazildi.
```

`.argument("<org>", "...")` ile organizasyon adini zorunlu bir argüman yaptim.
Gun 15-16'daki veri hattinin (cek -> dogrula -> donustur -> kaydet/upsert)
aynisi, sadece artik bir CLI komutu.

## list Komutu ve Filtreler

```bash
npx tsx --env-file=.env main.ts list --language TypeScript --min-stars 100
```

```
14 repo listelendi (isim, dil, yildiz, url sutunlariyla)
```

Iki option tanimladim:

```typescript
.option("--language <dil>", "sadece belirtilen dildeki repolari goster")
.option("--min-stars <sayi>", "en az bu kadar yildizi olan repolari goster", (deger) => {
  const sayi = parseInt(deger, 10);
  if (Number.isNaN(sayi)) {
    throw new InvalidArgumentError("Sayisal bir deger olmali, ornegin --min-stars 100");
  }
  return sayi;
})
```

Filtreler dinamik olarak kuruluyor - hangi option verilmisse sadece o kosul sorguya
ekleniyor, hicbiri verilmezse tum tablo listeleniyor:

```typescript
const kosullar = [];
if (options.language) kosullar.push(eq(repos.language, options.language));
if (options.minStars !== undefined) kosullar.push(gte(repos.stars, options.minStars));
```

## Yardim Metinleri (--help)

```bash
npx tsx --env-file=.env main.ts --help
npx tsx --env-file=.env main.ts list --help
```

Her komuta `.description(...)` ve her option'a aciklama ekledigim icin, Commander
bunlari otomatik olarak duzenli bir yardim metnine cevirdi - ayrica bir "help" metni
yazmama gerek kalmadi.

## Gecersiz Kullanim Senaryolari (4. madde)

Dort senaryoyu bilerek denedim:

```bash
$ npx tsx --env-file=.env main.ts bilinmeyenkomut
error: unknown command 'bilinmeyenkomut'

$ npx tsx --env-file=.env main.ts sync
error: missing required argument 'org'

$ npx tsx --env-file=.env main.ts list --min-stars abc
error: option '--min-stars <sayi>' argument 'abc' is invalid. Sayisal bir deger olmali, ornegin --min-stars 100
```

Ilk ikisi Commander'in kendi kontrolu (bilinmeyen komut, eksik zorunlu argüman).
Ucuncusu benim yazdigim dogrulama - `--min-stars`'a sayi olmayan bir deger
verilirse `InvalidArgumentError` firlatiyorum. Bunu normal `Error` ile degil
ozellikle `InvalidArgumentError` ile yaptim, cunku normal Error firlatsaydim
kullaniciya cirkin bir stack trace gorunurdu; `InvalidArgumentError`, Commander'in
kendi hata formatiyla, tek satirlik anlasilir bir mesaj basiyor.

## Ogrendigim Kavramlar

- **Commander.js**: komut, argument ve option tanimlayip CLI olusturma
- **.argument vs .option**: zorunlu konumsal deger ile opsiyonel bayrak farki
- **InvalidArgumentError**: kullaniciya temiz hata mesaji gostermenin yolu
- **Otomatik yardim metni**: description'lardan --help ciktisinin uretilmesi
- **Komutlari modullere ayirma**: her komutun kendi dosyasinda yasamasi, ortak
  kodun paylasilan bir dosyada toplanmasi