# Semayi Koda Tasimak (ORM)

Staj Gun 11 odevi. Gun 9'da tablolari elle SQL yazarak olusturmustum. Bu odevde ayni uc tabloyu (developers, merge_requests, commits) Drizzle ORM ile TypeScript kodu olarak tanimladim, migration urettim ve seed programiyla doldurdum.

## Neler Var

- **schema.ts**: uc tablonun Drizzle ile TypeScript olarak tanimi (FK iliskileri dahil)
- **drizzle.config.ts**: Drizzle Kit ayarlari (dialect, sema yolu, cikti klasoru, db yolu)
- **drizzle/**: Drizzle Kit'in urettigi SQL migration dosyalari (surum kontrolunde tutuluyor)
- **seed.ts**: ORM uzerinden 12 developer, 30 MR, ~110 commit ekleyen program
- **staj.db**: seed sonrasi olusan veritabani (git'e eklenmiyor, seed'den tekrar uretilebilir)

## Kullanilan Araclar

- **drizzle-orm**: ORM'in kendisi, semayi TS'te tanimlamayi ve tip guvenli sorgu yazmayi saglar
- **better-sqlite3**: SQLite surucusu, Drizzle'in gercek veritabaniyla konusmasini saglar
- **drizzle-kit**: CLI araci, semadan SQL migration uretir

## Calistirma

```bash
npm install
npm run db:generate   # semadan SQL migration uret
npm run db:migrate    # migration'i veritabanina uygula
npx tsx seed.ts       # veritabanini doldur
```

## Migration Nedir?

Migration, sema degisikliklerini surum kontrolune alma yontemi. `db:generate` calistirdigimda Drizzle, schema.ts'i okuyup CREATE TABLE komutlarini iceren bir .sql dosyasi uretiyor (drizzle/ klasorune). `db:migrate` ise bu SQL'i veritabanina uyguluyor.

Faydasi: yarin bir sutun eklersem, yeni bir migration dosyasi olusuyor. Boylece semanin tum gecmisi, tipki kod gibi, adim adim kayit altinda tutuluyor. Ekip halinde calisirken herkes ayni sema degisikliklerini ayni sirayla uygulayabiliyor.

## Kendi SQL'im vs Drizzle'in Urettigi SQL

Gun 9'da elle yazdigim CREATE TABLE ile Drizzle'in schema.ts'ten urettigi SQL islevsel olarak ayni, ama bazi farklar var.

### Benim yazdigim (Gun 9)

```sql
CREATE TABLE developers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  team TEXT
);
```

### Drizzle'in urettigi

```sql
CREATE TABLE `developers` (
  `id` integer PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `email` text,
  `team` text
);
```

### Farklar

1. **Backtick kullanimi**: Drizzle tum tablo ve sutun adlarini backtick (`) icine aliyor. Bu, ismin SQL'in ozel bir kelimesiyle (ornegin `order`) cakismasini onluyor. Ben backtick kullanmamistim; Drizzle her ihtimale karsi hepsini backtick'liyor.

2. **PRIMARY KEY NOT NULL**: Ben `id INTEGER PRIMARY KEY` yazmistim. Drizzle `PRIMARY KEY NOT NULL` yaziyor. SQLite'ta primary key zaten NOT NULL'dir ama Drizzle bunu acikca belirtiyor, hicbir seyi varsayima birakmiyor.

3. **Foreign key'de ON UPDATE / ON DELETE**: Benim FK'im sadece `REFERENCES developers(id)` idi. Drizzle sonuna `ON UPDATE no action ON DELETE no action` ekliyor. Bu, referans edilen kayit silinir/degisirse ne olacagini belirtiyor; `no action` zaten varsayilan davranis ama Drizzle acikca yaziyor.

4. **statement-breakpoint**: Drizzle tablolar arasina `--> statement-breakpoint` yorumu koyuyor. Bu, migration'i calistirirken komutlari nereden bolecegini bilmesi icin kendi isareti.

5. **Kucuk/buyuk harf**: Ben INTEGER, TEXT (buyuk) yazdim, Drizzle integer, text (kucuk) yaziyor. SQL buyuk/kucuk harfe duyarsiz oldugu icin ikisi de calisir, sadece stil farki.

### Genel gozlem

Drizzle'in urettigi SQL benimkiyle ayni isi yapiyor ama daha acik ve savunmaci: her seyi backtick'liyor, varsayilanlari bile aciktan yaziyor, hicbir seyi tesadufe birakmiyor. Ben "insan icin okunakli" yazmistim, Drizzle "makine icin guvenli" uretiyor.

## ORM'in Bana Kattigi

- **Tip guvenligi**: Sorgu yazarken sutun adlarinda otomatik tamamlama var. `name` yerine `naem` yazsam TypeScript daha kod calismadan hata veriyor. Elle SQL'de bu koruma yok.
- **SQL uretimini Drizzle yapiyor**: Gun 9'da INSERT satirlarini elle string olarak uretiyordum (tirnak kacirma, NULL formati derdi). Burada `db.insert(developers).values(...)` yazinca Drizzle SQL'i kendi uretti, tirnak ve NULL islerini otomatik halletti.
- **Migration**: Sema degisikligi surum kontrolunde. Veritabaninin de tipki kod gibi bir gecmisi oluyor.

## Ogrendigim Kavramlar

- **ORM**: veritabani semasini kod icinde tanimlama, SQL'i ORM'in uretmesi
- **sqliteTable / integer / text**: Drizzle'da tablo ve sutun tanimlama
- **.references()**: foreign key'in TS karsiligi
- **Migration (generate/migrate)**: semadan SQL uretme ve veritabanina uygulama
- **db.insert().values().run()**: ORM uzerinden tip guvenli veri ekleme
- **Silme sirasi ve FK**: bagimli tabloyu (commits) once silmek gerekiyor, yoksa FK hatasi