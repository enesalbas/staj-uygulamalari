# Satış Verisi Analizi

Staj Gün 3 ödevi. Koleksiyon metodlarıyla gruplama, özetleme ve zincirleme — hiçbir yerde elle `for` döngüsü kullanılmadan.

## Neler Var

- **satislar.json**: 40 satış kaydı (ürün, kategori, şehir, tutar, tarih)
- **main.ts**: veriyi async okuyup şu analizleri yapan program:
  1. Kategoriye göre toplam ciro (`reduce` ile gruplama + toplama)
  2. Şehir bazında ortalama sepet tutarı, azalan sıralı (`reduce` ile toplam+adet biriktirme, `Object.entries` + `map` + `sort`)
  3. En çok ciro yapan ilk 3 ürün (gruplama + `sort` + `slice`)
  4. Her kategorideki en pahalı ürün (gruplama + grup içinde maksimum bulma)
  5. Aya göre ciro dağılımı (tarihi `slice` ile aya indirgeyip gruplama)
  6. İstanbul'daki elektronik satışlarının tutara göre azalan ilk 5'i (tek zincir, ara değişkensiz)
- **try/catch**: dosya bulunamazsa veya JSON bozuksa program çökmez, hata mesajı basar

## Kurulum ve Çalıştırma

Proje kökünden:

```bash
npm install
npm run start gun-03/main.ts
```

Sonuçları `console.log` yerine `console.table` ile basıyorum, ödevde tablo isteniyordu.

## Öğrenilen Kavramlar

- **reduce ile gruplama**: `grup[anahtar] = (grup[anahtar] ?? 0) + değer` kalıbı — tüm gruplama işlerinin temeli
- **`??` (nullish coalescing)**: bir anahtar ilk kez görüldüğünde sıfırdan başlatmak için
- **Record<K, V>**: anahtar-değer tipini belirtmek (`Record<string, number>`, `Record<string, Satis>`)
- **Object.entries**: objeyi `[anahtar, değer]` dizisine çevirmek — sıralama yapabilmek için gerekli
- **Array destructuring**: `([sehir, veri]) => ...` ile dizi elemanlarını isimlendirilmiş değişkenlere dağıtmak
- **sort yönü**: `a - b` artan, `b - a` azalan
- **slice(0, n)**: bir dizinin ilk n elemanını almak (orijinali değiştirmeden)
- **Method chaining**: `filter().sort().slice()` — ara değişken kullanmadan tek akışta veri dönüştürmek
- **Grup içinde maksimum**: `if (!mevcut || s.tutar > mevcut.tutar)` — `||` kısa devre davranışı sayesinde güvenli karşılaştırma

## 4. maddede grup içinde maksimumu nasıl kurdum?

Burada tek bir işlem yok, iki işlem iç içe: önce kategoriye göre gruplamam, sonra her grubun kendi içinde
en pahalıyı bulmam gerekiyor.

İlk aklıma gelen iki adımdı: önce `Record<string, Satis[]>` ile kategorileri diziye ayır, sonra her diziyi
ayrı ayrı `reduce` ile tara. Çalışır ama veriyi iki kez geziyor ve bütün satışları dizi olarak tutuyor.

Bunun yerine accumulator'da diziyi değil, o ana kadarki en pahalı ürünü tuttum:

```typescript
const kategoriEnPahali = satislar.reduce((grup: Record<string, Satis>, s) => {
  const mevcut = grup[s.kategori];
  if (!mevcut || s.tutar > mevcut.tutar) {
    grup[s.kategori] = s;
  }
  return grup;
}, {});
```

`if` satırındaki iki durum:

- `!mevcut` → kategoriyi ilk kez görüyorum, karşılaştıracak bir şey yok, ilk ürünü direkt yazıyorum.
  1. maddedeki `?? 0` ile aynı iş aslında, ama burada başlangıç değeri olarak koyabileceğim bir "sıfır ürün"
  olmadığı için varlık kontrolü yapıyorum.
- `s.tutar > mevcut.tutar` → normal maksimum karşılaştırması.

Sıra önemli: `||` kısa devre yaptığı için `mevcut` yokken sağ taraf hiç çalışmıyor. Ters yazsaydım
`undefined.tutar` hatası alırdım.

Buradan çıkardığım şey, accumulator'da ne tuttuğumun her şeyi belirlediği. Toplam istiyorsam sayı,
ortalama istiyorsam `{toplam, adet}`, grup temsilcisi istiyorsam nesnenin kendisi.

`console.table`'a verirken `Object.values()` ile diziye çeviriyorum, çünkü tabloyu diziden basıyor.