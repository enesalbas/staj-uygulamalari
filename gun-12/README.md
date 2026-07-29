# SQL'den ORM'e

Staj Gun 12 odevi. Gun 9'da elle SQL ile yazdigim bes analiz sorgusunu bu sefer Drizzle ORM ile yeniden yazdim.

## Neler Var

- **schema.ts**: uc tablonun Drizzle tanimi (Gun 11'den)
- **seed.ts**: veritabanini dolduran program. Son iki gelistirici bilerek hic MR/commit almiyor, boylece 5. sorgu (commit'i olmayanlar) anlamli sonuc veriyor
- **analiz.ts**: bes analiz sorgusunun ORM hali, ciktilar `console.table` ile basiliyor
- **KARSILASTIRMA.md**: her sorgunun SQL ve ORM hali yan yana, kendi yorumlarimla

## Calistirma

```bash
npm install
npm run db:migrate
npx tsx seed.ts
npx tsx analiz.ts
```

## SQL Anahtar Kelimelerinin ORM Karsiliklari

| SQL | Drizzle |
|---|---|
| `SELECT x, COUNT(*)` | `.select({ x: ..., n: count(...) })` |
| `FROM tablo` | `.from(tablo)` |
| `JOIN ... ON a = b` | `.innerJoin(tablo, eq(a, b))` |
| `LEFT JOIN` | `.leftJoin(tablo, eq(a, b))` |
| `WHERE a AND b` | `.where(and(a, b))` |
| `IS NULL` | `isNull(sutun)` |
| `GROUP BY` | `.groupBy(...)` |
| `ORDER BY x DESC` | `.orderBy(desc(x))` |
| `LIMIT 5` | `.limit(5)` |

Her SQL anahtar kelimesinin bir metod veya fonksiyon karsiligi var. `eq`, `and`, `isNull`, `count`, `desc`, `gte` fonksiyonlari `drizzle-orm` paketinden import ediliyor.

## Sorgu Sonucunun Tipi Nereden Geliyor?

Odevin sordugu soru buydu. Editorde bir sorgu sonucunun uzerine gelince cikan tipi inceledim.

Ornegin bu sorgu:

```typescript
const commitSayilari = db
  .select({
    isim: developers.name,
    commitSayisi: count(commits.id),
  })
  .from(commits)
  .innerJoin(developers, eq(commits.developerId, developers.id))
  .groupBy(developers.name)
  .all();
```

Editorde `commitSayilari` uzerine gelince cikan tip:

```typescript
{ isim: string; commitSayisi: number }[]
```

Bu tipi hicbir yerde ben yazmadim. Nereden geldigini adim adim takip ettim:

1. **Kaynak schema.ts**: orada `name: text("name").notNull()` yazmisim. `text()` bu sutunun metin oldugunu, `.notNull()` ise NULL olamayacagini soyluyor. Drizzle bu ikisini birlestirip sutunun TypeScript tipini `string` olarak belirliyor. Eger `.notNull()` yazmasaydim tip `string | null` olurdu.

2. **select icindeki nesne**: `{ isim: developers.name }` yazdigimda Drizzle, `isim` alaninin tipini `developers.name` sutununun tipinden aliyor. Yani anahtar adi benim (`isim`), tipi ise semadan geliyor.

3. **count() fonksiyonu**: `count(commits.id)` her zaman sayi dondurdugu icin `commitSayisi` alani otomatik `number` oluyor.

4. **.all()**: tek satir degil butun satirlar donecegi icin sonuc bir dizi, yani tipin sonuna `[]` ekleniyor.

Ozetle tip zinciri soyle isliyor:

```
schema.ts sutun tanimi -> select nesnesi -> sorgu sonucu tipi
```

Bunun pratik faydasini soyle test ettim: `commitSayilari[0].isim` yazinca editor otomatik tamamladi, ama `commitSayilari[0].name` yazinca hemen hata verdi. Cunku ben alana `isim` adini vermistim ve tip bunu biliyor.

Ayni sekilde `email` alanini secen bir sorguda tip `string | null` cikiyor, cunku semada `.notNull()` yok. Yani sema, sorgu sonucundaki NULL ihtimalini bile tasiyor.

Ham SQL ile calisirken bu bilgilerin hicbiri yok: sonuc genelde `any` oluyor ve yanlis alan adini ancak program calisirken fark ediyorum.

## Ogrendigim Kavramlar

- **Sorgu olusturucu (query builder)**: sorguyu metod zinciriyle kurma
- **eq / and / isNull / gte**: SQL kosullarinin fonksiyon karsiliklari
- **count / desc**: aggregate ve siralama fonksiyonlari
- **innerJoin vs leftJoin**: ORM tarafinda da ayni mantik, sadece metod adi degisiyor
- **Tip cikarimi (type inference)**: sorgu sonucunun tipinin sema tanimindan otomatik uretilmesi
- **ORM'in siniri**: yazim hatalarini yakaliyor ama mantik hatalarini yakalamiyor. `.leftJoin` yerine `.innerJoin` yazsam TypeScript sikayet etmez, ama sorgu bos doner