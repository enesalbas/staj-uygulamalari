# Kavram: İlişkisel Veritabanı ve SQL

Staj Gun 8 odevi. Bugun hic TypeScript yazmadim, sadece SQL calistim. Veriyi programin icinde degil, bir veritabaninda saklamayi ogrendim.

## Neler Var

- **staj.db**: SQLite veritabani dosyasi (ikili format, VS Code'da acilamaz, sqlite3 ile acilir)
- **sorgular.sql**: bugun yazdigim tum SQL komutlari, her birinin ustunde ne yaptigini anlatan `--` yorumlariyla
- **developers tablosu**: id, name, email, team sutunlari; 12 kayit eklendi (birkacinin email'i bilerek NULL birakildi)

## Calistirma

```bash
cd gun-08
sqlite3 staj.db
```

SQLite prompt'unda:

```sql
.mode column
.headers on
SELECT * FROM developers;
```

`.mode column` ve `.headers on` ciktiyi hizali tablo halinde gosteriyor, okumasi cok daha kolay oluyor.

## Yazdigim Sorgular

| Ne yapiyor | SQL |
|---|---|
| Belirli takimdakileri listele | `SELECT * FROM developers WHERE team = 'Backend';` |
| Isme gore sirala | `SELECT * FROM developers ORDER BY name;` |
| Ilk 5 kaydi getir | `SELECT * FROM developers LIMIT 5;` |
| Email'i NULL olanlari bul | `SELECT * FROM developers WHERE email IS NULL;` |
| Bir kaydin email'ini guncelle | `UPDATE developers SET email = '...' WHERE id = 5;` |
| Bir kaydi sil | `DELETE FROM developers WHERE id = 12;` |

## Dikkat Ettigim Noktalar

- **NULL kontrolu**: `email = NULL` calismiyor, `IS NULL` kullanmak gerekiyor. Cunku SQL'de NULL "bilinmeyen deger" demek, bilinmeyen bir seyin baska bir seye esit olup olmadigi da bilinemiyor.
- **WHERE'in onemi**: `UPDATE` ve `DELETE` komutlarinda WHERE unutulursa tablodaki **tum satirlar** etkileniyor. Yani `DELETE FROM developers;` yazsam butun kayitlar silinirdi. Bu yuzden her zaman WHERE ile hangi satiri hedefledigimi belirttim.
- **Tek tirnak**: SQL'de metinler tek tirnak icinde yazilir, cift tirnak farkli anlama geliyor.

## JSON yerine veritabani kullanmanin 3 avantaji

Gun 6'da veriyi JSON dosyasinda saklamistim. Bugun ayni isi veritabaniyla yapinca farklari acikca gordum:

### 1. Sorgulama gucu

Gun 6'da "Backend takimindakileri getir" demek icin once butun dosyayi okuyup bellege almam, sonra `filter` ile suzmem gerekiyordu. Veritabaninda bu tek satir:

```sql
SELECT * FROM developers WHERE team = 'Backend';
```

Filtreleme, siralama, ilk N kayit gibi islemler icin ayri ayri kod yazmiyorum; SQL'in kendi anahtar kelimeleri (WHERE, ORDER BY, LIMIT) bu isi hallediyor.

### 2. Performans ve verimlilik

JSON'da tek bir kaydi okumak icin bile `readFile` ile **dosyanin tamamini** bellege almak zorundaydim. Kayit sayisi buyudukce bu ciddi bir sorun olurdu.

Veritabani ise dosyayi bastan sona okumuyor, indeks yapisi sayesinde dogrudan ihtiyaci olan yere gidiyor. Ayni sekilde guncelleme tarafinda da fark var: Gun 6'da bir bakiyeyi degistirmek icin butun dosyayi yeniden yaziyordum (`writeFile`), veritabaninda `UPDATE ... WHERE id = 5` sadece o satira dokunuyor.

### 3. Veri butunlugu

Tabloyu olustururken kurallar koydum:

```sql
name TEXT NOT NULL
```

Bu sayede `name` alani bos birakilan bir kayit **hic olusamiyor**, veritabani en basta reddediyor. JSON'da ise dosya sadece bir metin dosyasi oldugu icin kural tanimiyor; bozuk bir kayit sorunsuz yazilabiliyor ve hata ancak program o veriyi okumaya calistiginda ortaya cikiyor.

Nitekim Gun 6'da tam bu yuzden `hesapKaydiMi` diye bir dogrulama fonksiyonu yazmak zorunda kalmistim. Veritabaninda bu kontroller zaten tablo tanimindaki kisitlarla (NOT NULL, PRIMARY KEY, veri tipleri) saglaniyor.

## Ogrendigim Kavramlar

- **Tablo, satir, sutun**: verinin duzenli sekilde saklanma bicimi
- **CREATE TABLE**: tablo ve sutun kurallarini tanimlama
- **INSERT INTO**: yeni kayit ekleme
- **SELECT / WHERE / ORDER BY / LIMIT**: veri sorgulama, filtreleme, siralama, sinirlandirma
- **UPDATE / DELETE**: mevcut kayitlari guncelleme ve silme
- **NULL ve IS NULL**: bos degerlerin ozel durumu
- **PRIMARY KEY**: her satiri benzersiz tanimlayan anahtar