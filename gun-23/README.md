# Kaliteyi Otomatiklestir

Staj Gun 23 odevi. Projeye ESLint + Prettier ekledim, tum kod tabanini biçimlendirdim,
lint ve testleri tek komutla calisir hale getirdim, ve eski bir dosyami kod gozden
gecirme mantigiyla inceledim.

## Neler Var

- **eslint.config.js**: ESLint yapilandirmasi (flat config, TypeScript kurallariyla)
- **.prettierrc.json**: Prettier bicimlendirme kurallari
- **KOD-GOZDEN-GECIRME.md**: `gun-06/main.ts` uzerine 3 yapici yorum

## Katki Rehberi

Projeye katkida bulunmadan once:

```bash
npm install
```

Kod yazarken/gonderirken calistirilmasi gerekenler:

```bash
npm run format        # tum kodu Prettier ile bicimlendirir
npm run lint           # ESLint ile statik analiz yapar
npm test               # Vitest ile testleri calistirir
```

Tumunu tek seferde calistirmak icin:

```bash
npm run format && npm run lint && npm test
```

## ESLint Yapilandirmasi

```javascript
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  { ignores: ["node_modules/**", "dist/**", "drizzle/**"] }
);
```

`eslintConfigPrettier`'i en sona koydum, cunku onceki kurallarin bicim (stil) ile
ilgili kisimlarini kapatmasi gerekiyor - yoksa ESLint ve Prettier ayni konuda
(bosluk, satir sonu gibi) celisen kurallar verebilirdi.

Kurallari `"error"` degil `"warn"` yaptim - proje su an calisan bir uygulama,
gelecekte bir uyari cikarsa CI'yi kirmadan gorunur olmasini istedim.

## Sonuc: Kod Tabani Zaten Temizdi

`npm run lint` calistirdigimda 16 dosyanin tumu tarandi ama **sifir uyari** cikti.
Bunun linter'in calismadigi anlamina gelmedigini kanitlamak icin, bilerek bozuk bir
test dosyasi olusturup dogruladim:

```typescript
const kullanilmayanDegisken = 5;
function testFonksiyonu(parametre: any) {
  return parametre;
}
```

```
warning  'kullanilmayanDegisken' is assigned a value but never used  @typescript-eslint/no-unused-vars
warning  'testFonksiyonu' is defined but never used                  @typescript-eslint/no-unused-vars
warning  Unexpected any. Specify a different type                    @typescript-eslint/no-explicit-any
```

ESLint bu uc sorunu dogru sekilde yakaladi, sonra test dosyasini sildim. Yani gercek
kod tabanindaki sifir uyari, aracin calismamasindan degil, Gun 22'de katmanlara
ayirirken zaten tip guvenli (any'siz, kullanilmayan degiskensiz) yazmis olmamdan
kaynaklaniyor.

## Giderilemeyen Uyari

Yok - lint tamamen temiz gecti. Eger ileride bir uyari cikarsa (ornegin yeni bir
gunde `any` kullanmak zorunda kalirsam), burada gerekcesiyle not dusecegim.

## Kod Gozden Gecirme

`KOD-GOZDEN-GECIRME.md` dosyasinda `gun-06/main.ts`'i (stajin ilk haftasindan kendi
kodum) inceledim. Uc madde:

1. **`any` kullanimi** (`fromJSON(veri: any)`) - bugun ESLint kurunca `no-explicit-any`
   kuralinin tam bunun icin var oldugunu gordum
2. **Tekrar eden catch bloklari** - Hafta Sonu 4'te zaten duzeltmistim,
   burada da bir kod kokusu ornegi olarak not düstum
3. **Genel degisken adlandirmasi** (`veri` yerine `hesapVerisi` gibi daha aciklayici
   bir isim)

Bu inceleme, kendi eski kodumu bugunku bilgimle tekrar okumanin, o zamanki
kararlarimdaki eksikleri nasil gorunur kildigini gosterdi.

## Ogrendigim Kavramlar

- **Formatter vs linter**: formatter (Prettier) stil sorularini otomatiklestirir
  (tirnak, bosluk), linter (ESLint) potansiyel hatalari yakalar (kullanilmayan
  degisken, any kullanimi)
- **Flat config**: ESLint'in yeni yapilandirma bicimi, bir dizi config objesini
  sirayla birlestirir
- **eslint-config-prettier**: linter ile formatter'in stil kurallarinin celismesini
  onlemenin yolu
- **warn vs error**: linter kurallarini projenin olgunluguna gore ayarlamak -
  yeni bir projede sikica error, calisan bir projede daha yumusak warn olabilir
- **Kod gozden gecirme (code review)**: kendi eski kodunu yeni bilgiyle tekrar
  okumanin, o zaman gormedigin seyleri gostermesi
