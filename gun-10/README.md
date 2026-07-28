# Kütüphane Takip Sistemi Veri Modellemesi

Staj Gun 10 odevi. Gercek dunyadaki bir problemi (kütüphane işleyişi) tablolara ve iliskilere doktup, constraints (kisitlar) ekleyerek veri tutarliligini sagladim. Son olarak da sık kullanılan bir sorguyu hizlandirmak icin index ekleyip performansini (SCAN vs SEARCH) analiz ettim.

## Neler Var

- **cizim.jpg**: Veritabani tablolarinin ve iliskilerinin kagit uzerindeki ER diyagrami tasarimi
- **sema.sql**: CREATE TABLE komutlari ve veri tutarliligini saglayan NOT NULL, UNIQUE, FOREIGN KEY kisitlari
- **sorgular.sql**: Ornek veriler ve istenen 3 temel analiz sorgusu
- **README.md**: Projenin dokumantasyonu ve index analiz raporu

## Tablolar Arasi Iliski

```
Uyeler
    ^
    | uye_id
    |
OduncIslemleri
    |
    | kitap_id
    v
Kitaplar
```

Bir uye birden fazla kitap odunc alabilir, bir kitap da farkli zamanlarda birden fazla kez odunc verilebilir. Bu "Coka-Cok" (Many-to-Many) baglantiyi cozmek icin `OduncIslemleri` adinda bir kesisim tablosu olusturuldu. Bu tablo, iki tabloyu `FOREIGN KEY`'ler araciligiyla birbirine (bire-cok olacak sekilde) bagliyor.

## Calistirma

```bash
cd gun-10
sqlite3 kutuphane.db
```

SQLite prompt'unda:

```sql
.mode column
.headers on
.read sema.sql
.read sorgular.sql
```

## Kisitlar (Constraints) Neden Onemli?

Tablolari olustururken veritabanina çöp/hatali veri girmesini en bastan engellemek icin bazi kurallar koydum:

- **NOT NULL**: `Uyeler.ad_soyad` veya `Kitaplar.baslik` alanlarina uygulandi. Isimsiz uye veya basliksiz kitap eklenmesini engelliyor. Diger yandan `OduncIslemleri.iade_tarihi` alani bilerek NULL birakilabilir yapildi, cunku kitap henuz iade edilmemisse bu alanin bos kalmasi gerekiyor.
- **UNIQUE**: `Uyeler.email` ve `Kitaplar.isbn` (barkod) icin kullanildi. Ayni e-posta ile ikinci bir uyelik acilmasini veya ayni barkodla iki kitabin girilmesini (mukerrer veriyi) tamamen durdurdu.
- **FOREIGN KEY**: "Sisteme kayitli olmayan birine" veya "Kutuphanede var olmayan bir kitaba" islem yapilmasini (Referential Integrity - Tutarlilik garantisi) sagladi.

## Yazdigim Sorgular

| # | Soru | Kullanilan araclar |
|---|---|---|
| 1 | Su an disarida olan (iade edilmemis) kitaplar | JOIN + WHERE + IS NULL |
| 2 | En cok odunc alan uye | JOIN + GROUP BY + COUNT + ORDER BY + LIMIT |
| 3 | Hic odunc alinmamis kitaplar | WHERE + NOT IN + Subquery |

## Neden Index Ekledim? (Performans Analizi)

Veritabaninda "şu an dışarıda olan kitapları" bulmak icin surekli `WHERE iade_tarihi IS NULL` sartini ariyoruz. Eger kayit sayisi yuz binleri bulsaydi, veritabani bu sarti saglayanlari bulmak icin tablodaki her satiri tek tek okumak zorunda kalacakti. 

Bunu test etmek icin, index YOKKEN `EXPLAIN QUERY PLAN` calistirdigimda su ciktiyi aldim:
`--SCAN OduncIslemleri` (Veritabaninin tabloyu bastan sona taradigini gosterir, maliyeti cok yuksektir).

Hizi artirmak adina tabloya bir index tanimladim:
`CREATE INDEX idx_iade_tarihi ON OduncIslemleri(iade_tarihi);`

Ayni arama komutunu tekrar calistirdigimda su harika degisimi gordum:
`--SEARCH OduncIslemleri USING INDEX idx_iade_tarihi (iade_tarihi=?)`

Artik veritabani, kitabin "icindekiler" kismina bakar gibi hedefini dogrudan buluyor. SCAN isleminin SEARCH'e donusmesi, indekslemenin hiz/maliyet dengesinde ne kadar kritik bir rol oynadigini net bir sekilde kanitladi.

## Ogrendigim Kavramlar

- **Veri Modelleme**: Gercek hayattaki operasyonlari (kutuphane surecleri) uygun tablolara paylastirma
- **Kisitlar (Constraints)**: Veritabanina hatali (NULL, Duplicate, Yetim kayit) verilerin yazilmasini onleyen katman
- **Index**: Surekli Where kosulunda aranan bir sutun uzerinde ozel bir okuma agaci olusturarak sorgu hizini artirma
- **EXPLAIN QUERY PLAN**: Yazilan SQL sorgusunun arka planda nasil (SCAN, SEARCH) bir yolla ve maliyetle calisacagini gosteren profil komutu
- **NOT IN ve Alt Sorgular (Subqueries)**: Bir tablodaki kaydin id'sinin, baska bir tablonun id listesi icinde (SELECT) gecip gecmedigini test etme mantigi