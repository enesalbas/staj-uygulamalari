# Kalici Banka

Staj Gun 6 odevi. Hata yonetimi ve dosya I/O calisildi. Gun 4'teki banka modeli kalici hale getirildi.

## Neler Var

- **BankaHesabi sinifi**: Gun 4'ten geldi, uzerine kalicilik eklendi
- **toJSON / fromJSON**: nesneyi dosyaya yazilabilir hale getiriyor (serialize) ve geri okuyor (deserialize)
- **kaydet / yukle**: hesaplari JSON dosyasina yaziyor ve okuyor (writeFile / readFile)
- **YetersizBakiyeHatasi, GecersizTutarHatasi, KayitDosyasiHatasi**: kendi ozel hata tiplerim
- **instanceof**: her hata tipini ayirip kendi mesajiyla yakaliyorum
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

`hesaplar.json` icine bozuk bir metin yazilip calistirildi. Program yine cokmedi, anlamli bir hata verdi.

HATA: Kayit dosyasi bozuk! Icerigi gecerli JSON degil.

"Dosya yok" durumundan farkli bir mesaj veriyorum, cunku dosyanin var olup bozuk olmasi daha ciddi bir durum.

### 3. Gecersiz islem tutari

Negatif tutar ve yetersiz bakiye denendi, ikisi de kendi hata tipiyle yakalandi.

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

\`\`\`typescript
try {
  const metin = await readFile(DOSYA_YOLU, "utf-8");
  return JSON.parse(metin);
} catch (err) {
  return [];   // hata olursa sessizce bos dizi don
}
\`\`\`

Bu "guvenli" gorunur cunku program cokmez. Ama dosya bozuksa sessizce bos dizi doner, hicbir uyari vermez.
Program "hic hesap yok" sanip sifirdan baslar ve bir sonraki kaydetmede gercek verinin uzerine yazar. Yani
butun hesap gecmisi sessizce kaybolur, kimse de neden oldugunu bilemez cunku hata hic gorunmedi.

Ben bu yuzden hatayi yutmadim, gorunur hale getirdim:

\`\`\`typescript
} catch (err) {
  throw new KayitDosyasiHatasi("BOZUK_JSON");
}
\`\`\`

Kisacasi: bir hatayi yakaladiysan ya duzelt, ya bildir, ya da yeniden firlat. Asla boş döndürme.