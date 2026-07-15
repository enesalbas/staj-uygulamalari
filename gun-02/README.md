# Personel Veri Analizi

Staj Gün 2 ödevi. Koleksiyon metodlarıyla (map, filter, reduce) veri işleme — hiçbir yerde elle `for` döngüsü kullanılmadan.

## Neler Var

- **calisanlar.json**: 15 çalışanlık örnek veri (ad, takım, maaş, işe giriş yılı)
- **main.ts**: veriyi async okuyup şu işlemleri yapan program:
  1. Belirli bir takımdaki çalışanlar (`filter`)
  2. Sadece adlardan oluşan liste (`map`)
  3. Ortalama maaş ve en yüksek maaşlı çalışan (`reduce`)
  4. Takıma göre gruplanmış çalışan sayıları (`reduce`)
  5. İşe giriş yılına göre sıralı liste (`sort`)
  6. 2020'den önce girmiş ve maaşı ortalamanın üstünde olanlar (`filter`, iki koşul zincirlenmiş)
- **try/catch**: dosya bulunamazsa veya JSON bozuksa program çökmez, hata mesajı basar

## Kurulum ve Çalıştırma

```bash
npm install
npx ts-node main.ts
```

## Öğrenilen Kavramlar

- **filter**: bir koşulu sağlayan elemanları yeni bir dizide toplamak
- **map**: her elemanı dönüştürüp yeni bir dizi üretmek
- **reduce**: bir diziyi tek bir değere (toplam, obje, en büyük eleman vb.) indirgemek
- **sort**: bir diziyi karşılaştırma fonksiyonuna göre sıralamak
- Bu metodların hepsi, elle `for`/`while` döngüsü yazmadan veri işlemeyi sağlar (bildirimsel/declarative yaklaşım)