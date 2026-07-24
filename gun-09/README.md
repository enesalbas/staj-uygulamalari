# Cok Tablolu Analiz

Staj Gun 9 odevi. Dun tek tabloyla calismistim, bugun uc tabloyu birbirine baglayip JOIN, GROUP BY ve aggregate fonksiyonlarla rapor sorgulari yazdim.

## Neler Var

- **staj.db**: Gun 8'deki veritabanina iki yeni tablo eklendi
- **merge_requests tablosu**: id, title, developer_id, created_at, merged_at, status (30 kayit)
- **commits tablosu**: id, message, developer_id, merge_request_id, created_at (113 kayit)
- **veri-uret.ts**: INSERT satirlarini ureten TypeScript programi (elle 143 kayit yazmamak icin)
- **veri.sql**: programin urettigi INSERT komutlari
- **analiz.sql**: bes analiz sorgusu, her birinin ustunde ne yaptigini ve neden oyle yazildigini anlatan yorumlar

## Tablolar Arasi Iliski

```
developers
    ^
    | developer_id
    |
merge_requests
    ^
    | merge_request_id
    |
commits
```

Bir gelistiricinin birden cok MR'i, bir MR'in birden cok commit'i olabiliyor (bire-cok iliski). Bu bag `FOREIGN KEY` ile tanimlandi.

## Calistirma

```bash
# Veriyi uret (isteğe bagli, veri.sql zaten repoda)
npm run start gun-09/veri-uret.ts

# Veritabanini ac
cd gun-09
sqlite3 staj.db
```

SQLite prompt'unda:

```sql
.mode column
.headers on
.read analiz.sql
```

## Veriyi Neden Programla Urettim?

Odev en az 30 MR ve 100 commit istiyordu. Bunlari elle yazmak hem cok uzun surerdi hem de tutarsiz veri uretme riski yuksekti. Bunun yerine `veri-uret.ts` ile INSERT satirlarini urettim.

Programda dikkat ettigim tutarlilik kurallari:

- **status ve merged_at uyumu**: sadece `merged` durumundaki MR'larin merge tarihi var, digerleri NULL. Aksi halde "acik ama merge edilmis" gibi anlamsiz kayitlar olusurdu
- **Tarih siralamasi**: merge tarihi olusturma tarihinden sonra, commit tarihi de MR acildiktan sonra
- **Sahiplik**: bir commit'in gelistiricisi, ait oldugu MR'in sahibiyle ayni. Rastgele atasaydim "baskasinin MR'ina commit atilmis" gibi tuhaf veriler cikardi
- **Tarih dagilimi**: MR'lar son 90 gune yayildi, boylece "son 30 gun" sorgusu anlamli sonuc veriyor

## Yazdigim Sorgular

| # | Soru | Kullanilan araclar |
|---|---|---|
| 1 | Her gelistiricinin commit sayisi (azalan) | JOIN + GROUP BY + COUNT + ORDER BY |
| 2 | Son 30 gunde acilmis, merge edilmemis MR'lar | WHERE + date() + IS NULL |
| 3 | En cok commit yapan ilk 5 gelistirici | 1. sorgu + LIMIT |
| 4 | Her takim icin MR sayisi | JOIN + GROUP BY |
| 5 | Hic commit'i olmayan gelistiriciler | LEFT JOIN + IS NULL |

## Neden LEFT JOIN? (5. soru)

Bu soru bugunku en ogretici kisimdi.

Normal `JOIN` (yani INNER JOIN) sadece iki tabloda **eslesen** satirlari getiriyor. Hic commit'i olmayan bir gelistirici, `commits` tablosunda hic gecmedigi icin eslesme bulamiyor ve sonuctan tamamen siliniyor. Yani INNER JOIN, tam da aradigim kayitlari daha en basta eliyor.

`LEFT JOIN` ise SOL tablodaki (`developers`) her satiri koruyor. Eslesme yoksa sag tablonun sutunlarini NULL ile dolduruyor. Bu yuzden `WHERE commits.id IS NULL` kosulu "hic commit'i olmayanlar" anlamina geliyor.

Tablo sirasi da onemli: korumak istedigim satirlar `developers`'ta oldugu icin o SOLDA olmali.

Bu senaryoyu test edebilmek icin, MR/commit uretiminde hic kullanilmayan iki gelistirici ekledim (yeni ise baslamis, henuz kod yazmamis kisiler gibi dusunulebilir).

## Ogrendigim Kavramlar

- **FOREIGN KEY**: bir tablodaki sutunun baska tablodaki kaydi isaret etmesi
- **JOIN ... ON**: iki tabloyu belirtilen sutunlar uzerinden birlestirme
- **INNER vs LEFT JOIN**: eslesenleri getirmek ile sol tablonun tamamini korumak arasindaki fark
- **COUNT(\*)**: satir sayma (aggregate fonksiyon)
- **GROUP BY**: kirilim alma. Bu aslinda Gun 2'de TypeScript'te yazdigim `grup[anahtar] = (grup[anahtar] ?? 0) + 1` kalibinin SQL karsiligi, ama tek satirda ve isi veritabani yapiyor
- **AS**: sutuna takma ad verme
- **date('now', '-30 days')**: SQLite'in tarih hesaplama fonksiyonu
- **SQL cumle sirasi**: SELECT -> FROM -> JOIN -> WHERE -> GROUP BY -> ORDER BY -> LIMIT (bu sira sabit)