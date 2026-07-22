# Kalici Banka

Staj Gun 6 odevi. Hata yonetimi ve dosya I/O calisildi. Gun 4'teki banka modeli kalici hale getirildi.

## Neler Var

- **BankaHesabi sinifi**: Gun 4'ten geldi, uzerine kalicilik eklendi
- **toJSON / fromJSON**: nesneyi dosyaya yazilabilir hale getiriyor (serialize) ve geri okuyor (deserialize)
- **kaydet / yukle**: hesaplari JSON dosyasina yaziyor ve okuyor (writeFile / readFile)
- **YetersizBakiyeHatasi, GecersizTutarHatasi, KayitDosyasiHatasi**: kendi ozel hata tiplerim
- **instanceof**: her hata tipini ayirip kendi mesajiyla yakaliyorum
- **hesapKaydiMi**: dosyadan gelen veriyi kontrol eden type guard
- **hesaplar.json**: hesaplar ve islem gecmisi burada kalici olarak saklaniyor

## Calistirma

```bash
npm install
npm run start gun-06/main.ts
```

Program her calistiginda hesaplari dosyadan yukluyor, islem yapiyor, tekrar kaydediyor. Yani bakiyeler her
calistirmada hatirlaniyor ve birikiyor.

## Test Ettigim Senaryolar

### 1. Dosya hic yok

`hesaplar.json` silinip calistirildi. Program cokmedi, sifirdan basladi.

### 2. Dosya var ama bozuk JSON

Icine bozuk bir metin yazilip calistirildi. Program cokmedi, hata verdi ve dosyaya dokunmadi:

    HATA: Kayit dosyasi bozuk! Icerigi gecerli JSON degil.
    Bozuk dosyanin uzerine yazmamak icin kayit atlandi.

### 3. Gecersiz islem tutari

Negatif tutar ve yetersiz bakiye denendi, ikisi de kendi hata tipiyle yakalandi.

### 4. JSON gecerli ama dizi degil

Icine `{}` yazildi. Eskiden bu da "bozuk JSON" diye raporlaniyordu, halbuki JSON gayet gecerli. Simdi ayri
bir mesaj veriyor:

    HATA: Kayit dosyasinin bicimi beklenenden farkli: Kayit dosyasi bir hesap dizisi icermeli.

### 5. Dizi icinde eksik alanli kayit

`[{"hesapNo":"TR001"}]` yazildi. Kacinci kaydin bozuk oldugunu da soyluyor:

    HATA: Kayit dosyasinin bicimi beklenenden farkli: 0. kayit hesap bicimine uymuyor.

### 6. Dosya okunamiyor

Dosya okunamaz hale getirilip calistirildi (test icin klasore cevirdim, `EISDIR` hatasi veriyor). Program
sifirdan baslamiyor, hic kaydetmeden cikiyor:

    Kayit dosyasi okunamadi, veri kaybi olmamasi icin cikiliyor: Error: EISDIR ...

## Kendi hata tiplerini neden tanimladim?

Onceden butun hatalar tek tip (`Error`) idi, yakalarken birbirinden ayirt edemiyordum. Kendi tiplerimi
tanimlayinca `instanceof` ile "bu yetersiz bakiye hatasi mi, gecersiz tutar hatasi mi?" diye sorabiliyorum
ve her birine farkli tepki verebiliyorum. Boylece hata mesajlari daha anlamli oluyor.

## Dosya bozuksa neden "yok" muamelesi yapmadim?

Dosyanin hic olmamasi normal bir durum (ilk calistirma), o yuzden sessizce sifirdan basliyorum. Ama dosyanin
var olup bozuk olmasi anormal bir durum, belki veri kaybi var. O yuzden bu ikisini ayirdim ve bozuk dosya
icin ayri, dikkat cekici bir hata mesaji verdim. Hatayi yutmak yerine kullaniciya net sekilde bildiriyorum.

## "Hata Yutma" Anti-Pattern'i Neden Tehlikeli?

Bir hatayi yakalayip hicbir sey yapmamak (bos catch blogu) "hata yutma" denen kotu bir aliskanlik. Program
cokmez ama hata sessizce kaybolur, asil tehlike de bu.

Ornegin dosya okumayi soyle yazsaydim:

```typescript
try {
  const metin = await readFile(DOSYA_YOLU, "utf-8");
  return JSON.parse(metin);
} catch (err) {
  return [];   // hata olursa sessizce bos dizi don
}
```

Bu "guvenli" gorunur cunku program cokmez. Ama dosya bozuksa sessizce bos dizi doner, hicbir uyari vermez.
Program "hic hesap yok" sanip sifirdan baslar ve bir sonraki kaydetmede gercek verinin uzerine yazar. Yani
butun hesap gecmisi sessizce kaybolur, kimse de neden oldugunu bilemez cunku hata hic gorunmedi.

Kisacasi: bir hatayi yakaladiysan ya duzelt, ya bildir, ya da yeniden firlat. Asla boş döndürme.

## Ama ayni seyi kendi kodumda yapiyormusum

Yukaridaki bolumu yazmisim, sonra kendi `yukle()` fonksiyonumda tam olarak ayni seyi yaptigimi fark ettim:

```typescript
} catch (err) {
  throw new KayitDosyasiHatasi("DOSYA_YOK");   // her hata "dosya yok" sayiliyor
}
```

`readFile`'in her hatasi "dosya yok" sayiliyordu. Dosya gercekten yoksa sorun yok ama izin hatasi ya da disk
sorunu olsa da program sifirdan baslar, sonra `kaydet()` cagirip var olan verinin uzerine yazardi. Yani hata
gorunuyordu ama teshis yanlisti, sonuc yine veri kaybi.

Duzeltmek icin hata kodunu kontrol ediyorum:

```typescript
} catch (err) {
  if (dosyaBulunamadiMi(err)) {   // err.code === "ENOENT"
    throw new KayitDosyasiHatasi("DOSYA_YOK", "Kayit dosyasi bulunamadi.", { cause: err });
  }
  throw err;   // izin/disk hatasi: yutma, oldugu gibi firlat
}
```

Bir de sunu fark ettim: bozuk JSON durumunda "bozuk dosya korunuyor" yaziyordum ama program devam edip
sonunda `kaydet()` cagiriyordu, yani dosyanin uzerine yaziyordu. Mesaj dogruydu, davranis yanlisti.
`kaydedebilir` diye bir degisken ekledim, dosya bozuksa o calistirmada hic kaydetmiyor.

Buradan cikardigim ders: hatayi gormek ve bildirmek yetmiyor, ona gore bir sey yapmak da gerekiyor.

## Hata tiplerini neden string mesajla ayirmiyorum?

Once hata turunu mesajla ayirt ediyordum:

```typescript
if (err instanceof KayitDosyasiHatasi && err.message === "DOSYA_YOK") { ... }
```

Mesaji Turkcelestirdigim ya da sonuna nokta koydugum gun bu kosul sessizce tutmaz, derleyici de uyarmaz.
Onun yerine ayri bir `kod` alani ekledim:

```typescript
type KayitHataKodu = "DOSYA_YOK" | "BOZUK_JSON" | "GECERSIZ_BICIM";
```

Artik mesaj insana, `kod` koda hitap ediyor. Union type oldugu icin `err.kod === "DOSYA_YOKK"` yazarsam
derleme hatasi aliyorum. Ayrica `{ cause: err }` ile orijinal hatayi da tasiyorum, sebep kaybolmuyor.

## try blogunu daralttim

Onceden tek `try` hem `JSON.parse`'i hem de `fromJSON` donusumunu sariyordu. Bu yuzden `fromJSON`'dan gelen
herhangi bir hata da "bozuk JSON" gibi gorunuyordu, halbuki JSON gecerli olabilir. Simdi `try` sadece
`JSON.parse`'i sariyor, bicim kontrolu disarida ve ayri bir kod donduruyor.

Kural olarak `try` blogu, hatasini gercekten karsilayabildigim en kucuk parca kadar olmali.

## any yerine tip kontrolu

`fromJSON(veri: any)` yaziyordum, yani dosyadan gelen veriye kosulsuz guveniyordum. Iki sorun vardi:

- `veriler.map(...)` cagriliyordu ama `veriler`'in dizi oldugu kontrol edilmiyordu. Dosyada `{}` varsa
  `veriler.map is not a function` hatasi aliniyor, bu da "BOZUK_JSON" diye raporlaniyordu.
- Alanlar eksik olsa fark edilmiyor, hata cok sonra baska bir yerde patliyordu.

Simdi `unknown` ile basliyorum ve type guard ile dogruluyorum:

```typescript
function hesapKaydiMi(veri: unknown): veri is HesapKaydi {
  if (typeof veri !== "object" || veri === null) return false;
  const kayit = veri as Record<string, unknown>;
  return typeof kayit.hesapNo === "string"
    && typeof kayit.sahibi === "string"
    && typeof kayit.bakiye === "number"
    && Array.isArray(kayit.islemGecmisi);
}
```

`veri is HesapKaydi` sayesinde `if` blogunun icinde TypeScript artik `veri`'yi `HesapKaydi` biliyor, `any`
kullanmadan tipli koda geciyorum.

Bu arada bunun Zod'un yaptigi is oldugunu fark ettim. Zod'da ayni sey `z.object({...})` semasi ve
`safeParse` ile tek satirda oluyor, ustelik hangi alanin bozuk oldugunu da soyluyor. Benim guard'im
`islemGecmisi`'nin dizi oldugunu kontrol ediyor ama icindeki her islemi tek tek dogrulamiyor, elle
yazinca is buyuyor. Odev 6'da Zod'a gecince neden kutuphane kullanildigini daha iyi anlayacagim.

## Dosyada beklenen hesap yoksa

`hesaplar[0]` ve `hesaplar[1]` diye indeksle erisiyordum. Dosyada tek hesap varsa `hesaplar[1]` `undefined`
oluyor ve program cokuyordu. Simdi once kontrol ediyorum:

```typescript
if (!hesap1 || !hesap2) {
  console.error("Kayit dosyasinda beklenen iki hesap yok, islem yapilmiyor.");
  process.exitCode = 1;
  return;
}
```

TypeScript'te `hesaplar[1]` tipi `BankaHesabi` gorunuyor ama calisma zamaninda `undefined` olabiliyor,
cunku dizi indeksleri varsayilan olarak kontrol edilmiyor. (`noUncheckedIndexedAccess` secenegi bunu
otomatik yakalatiyormus, sonra bakacagim.)
