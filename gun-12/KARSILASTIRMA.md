# SQL ve ORM Karsilastirmasi

Gun 9'da elle yazdigim bes analiz sorgusunu Gun 12'de Drizzle ORM ile yeniden yazdim. Bu dosyada ikisini yan yana koyup hangisinin nerede daha okunakli oldugunu not ettim.

## 1. Her gelistiricinin toplam commit sayisi (azalan)

**SQL**

```sql
SELECT developers.name, COUNT(*) AS commit_sayisi
FROM commits
JOIN developers ON commits.developer_id = developers.id
GROUP BY developers.name
ORDER BY commit_sayisi DESC;
```

**ORM**

```typescript
db.select({
    isim: developers.name,
    commitSayisi: count(commits.id),
  })
  .from(commits)
  .innerJoin(developers, eq(commits.developerId, developers.id))
  .groupBy(developers.name)
  .orderBy(desc(count(commits.id)))
  .all();
```

**Yorumum:** Burada SQL daha kisa ve okunakli. ORM'de `count()`, `eq()`, `desc()` gibi fonksiyonlar ve parantezler satiri kalabaliklastiriyor. Ayrica SQL'de `ORDER BY commit_sayisi` diye takma ada referans verebiliyorum, ORM'de `desc(count(commits.id))` ifadesini tekrar yazmam gerekti.

ORM'in avantaji: `developers.name` yazarken editor otomatik tamamliyor ve yanlis sutun adi yazarsam kod calismadan hata veriyor.

## 2. Son 30 gunde acilmis ama merge edilmemis MR'lar

**SQL**

```sql
SELECT id, title, created_at, status
FROM merge_requests
WHERE created_at >= date('now', '-30 days')
  AND merged_at IS NULL;
```

**ORM**

```typescript
const otuzGunOnce = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

db.select({
    id: mergeRequests.id,
    baslik: mergeRequests.title,
    olusturma: mergeRequests.createdAt,
    durum: mergeRequests.status,
  })
  .from(mergeRequests)
  .where(and(gte(mergeRequests.createdAt, otuzGunOnce), isNull(mergeRequests.mergedAt)))
  .all();
```

**Yorumum:** SQL burada da daha kompakt, ozellikle `date('now', '-30 days')` tek satirda isi bitiriyor. ORM tarafinda tarihi TypeScript'te elle hesaplamam gerekti (`Date.now()` ve milisaniye carpimi).

Ama bu ayni zamanda ORM'in bir avantaji: tarih hesabi veritabanina degil koda ait oldugu icin, yarin PostgreSQL'e gecsem bu satir aynen calisir. SQL tarafindaki `date('now', ...)` ise SQLite'a ozgu, baska veritabaninda farkli yazilir.

Ikinci fark: `WHERE a AND b` yerine `where(and(a, b))` yazmak fonksiyon icinde fonksiyon oldugu icin ilk bakista daha yorucu.

## 3. En cok commit yapan ilk 5 gelistirici

**SQL**

```sql
SELECT developers.name, COUNT(*) AS commit_sayisi
FROM commits
JOIN developers ON commits.developer_id = developers.id
GROUP BY developers.name
ORDER BY commit_sayisi DESC
LIMIT 5;
```

**ORM**

```typescript
db.select({ isim: developers.name, commitSayisi: count(commits.id) })
  .from(commits)
  .innerJoin(developers, eq(commits.developerId, developers.id))
  .groupBy(developers.name)
  .orderBy(desc(count(commits.id)))
  .limit(5)
  .all();
```

**Yorumum:** Iki tarafta da 1. sorgunun sonuna tek satir eklendi (`LIMIT 5` / `.limit(5)`). Burada ORM'in zincir yapisi hos: sorguya bir parca eklemek gercekten "bir metod daha eklemek" kadar basit. SQL'de de ayni kolaylik var ama ORM'de bu parcalari degiskene atayip yeniden kullanabilirim, SQL'de metni kopyalamam gerekir.

## 4. Her takim icin MR sayisi

**SQL**

```sql
SELECT developers.team, COUNT(*) AS mr_sayisi
FROM merge_requests
JOIN developers ON merge_requests.developer_id = developers.id
GROUP BY developers.team
ORDER BY mr_sayisi DESC;
```

**ORM**

```typescript
db.select({ takim: developers.team, mrSayisi: count(mergeRequests.id) })
  .from(mergeRequests)
  .innerJoin(developers, eq(mergeRequests.developerId, developers.id))
  .groupBy(developers.team)
  .orderBy(desc(count(mergeRequests.id)))
  .all();
```

**Yorumum:** 1. sorgunun neredeyse aynisi, sadece gruplama alani ve tablo degisti. Iki tarafta da degisiklik ayni yerlerde oldu. Bu sorguda ORM'in tip guvenligi ise yaradi: `developers.team` yazarken editor bana developers tablosunun sutunlarini listeledi, `merge_requests`'te olmayan bir sutunu yanlislikla yazma ihtimalim kalmadi.

## 5. Hic commit'i olmayan gelistiriciler (LEFT JOIN)

**SQL**

```sql
SELECT developers.id, developers.name, developers.team
FROM developers
LEFT JOIN commits ON developers.id = commits.developer_id
WHERE commits.id IS NULL;
```

**ORM**

```typescript
db.select({
    id: developers.id,
    isim: developers.name,
    takim: developers.team,
  })
  .from(developers)
  .leftJoin(commits, eq(developers.id, commits.developerId))
  .where(isNull(commits.id))
  .all();
```

**Yorumum (odevin ozellikle sordugu sorgu):**

Bu sorguda iki taraf birbirine sasirtici derecede yakin. Cunku LEFT JOIN'in zor kismi sozdizimi degil, **mantik**: hangi tablonun solda oldugunu ve `IS NULL` kosulunun neden ise yaradigini bilmek gerekiyor. Bu mantik iki tarafta da ayni.

- SQL'de `FROM developers LEFT JOIN commits` yaziyorum
- ORM'de `.from(developers).leftJoin(commits, ...)` yaziyorum

Satir satir birebir ortusuyor. Yani ORM burada SQL'i gizlemiyor, sadece TypeScript sozdizimine ceviriyor. Drizzle'in felsefesi zaten bu: "SQL'i biliyorsan uzerine tip guvenligi ekle".

Ufak bir fark: SQL'de `WHERE commits.id IS NULL` ifadesi dogal dile cok yakin okunuyor. ORM'de `where(isNull(commits.id))` da anlasilir ama fonksiyon cagrisi oldugu icin bir tik daha teknik duruyor.

Onemli bir gozlem: ORM burada beni **korumuyor**. `.leftJoin` yerine `.innerJoin` yazsaydim TypeScript hic sikayet etmezdi, kod calisirdi ama sonuc bos donerdi. Yani ORM yazim hatalarini yakaliyor, mantik hatalarini yakalamiyor. LEFT JOIN'in ne ise yaradigini yine de bilmem gerekiyor.

## Genel Degerlendirme

### SQL'in daha iyi oldugu yerler

- **Kisa ve okunakli**: ozellikle aggregate ve gruplama iceren sorgularda SQL daha az yer kapliyor
- **Takma ad kullanimi**: `ORDER BY commit_sayisi` gibi, SELECT'te verdigim ada sonradan referans verebiliyorum
- **Karmasik sorgular**: pencere fonksiyonlari, alt sorgular gibi ileri seviye islerde SQL dogrudan yazmak daha rahat
- **Dogal okunurluk**: `WHERE merged_at IS NULL` neredeyse Ingilizce cumle gibi

### ORM'in daha iyi oldugu yerler

- **Tip guvenligi**: sutun adini yanlis yazarsam kod calismadan hata aliyorum. SQL'de bu hatayi ancak calistirinca goruyorum
- **Otomatik tamamlama**: `developers.` yazinca editor sutunlari listeliyor, semayi ezberlememe gerek yok
- **Sorgu parcalarini yeniden kullanma**: bir filtreyi degiskene atayip birkac sorguda kullanabiliyorum
- **Sema ile senkron kalma**: schema.ts'te bir sutun adini degistirirsem, o sutunu kullanan tum sorgular hemen hata veriyor. Ham SQL sessizce bozulurdu
- **Tasinabilirlik**: tarih hesabi gibi seyler kodda oldugu icin baska bir veritabanina gecmek daha kolay

### Benim sezgim: hangi durumda hangisi?

Gunluk CRUD islerinde ve orta karmasiklikta sorgularda ORM daha iyi: tip guvenligi ve otomatik tamamlama gercek zaman kazandiriyor, ozellikle sema degisirse.

Cok karmasik raporlama sorgularinda ham SQL daha rahat: ORM'i SQL'e benzetmeye calisirken kod SQL'den daha uzun ve daha az okunakli hale geliyor.

En onemli cikarim su: **ORM, SQL bilmemenin yerine gecmiyor.** 5. sorgudaki LEFT JOIN mantigini bilmeseydim, ORM bana bunu ogretmezdi. ORM sadece SQL'i daha guvenli ve tip destekli yazmami sagliyor.