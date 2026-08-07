# CLI'i ve Veri Hattini Test Etmek

Staj Gun 19 odevi. Bu hafta yazdigim CLI'in (Gun 15-18) gercek is mantigini, aga ve
veritabanina dokunmadan test ettim. Sahte veri, bellekte gecici veritabani ve test
kapsami raporu kullandim.

## Neler Var

- **validation.ts**: Gun 16'daki Zod semasi ve donusturme fonksiyonu, config'e bagimli
  olmayan bagimsiz bir dosyaya cikarildi
- **filtre.ts**: `list` komutunun filtre kurma mantigi, saf fonksiyona ayrildi
- **lib.test.ts**: dogrulama + donusturme testleri (sahte API cevabiyla)
- **filtre.test.ts**: list komutunun filtre mantigi testleri (bellekte gecici db ile)
- **upsert.test.ts**: upsert davranisi testleri (bellekte gecici db ile)

## Calistirma

```bash
npm install
npx vitest run
npx vitest run --coverage
```

## Karsilastigim Gercek Sorun: Bagimliligin Sizmasi

Ilk testi yazarken beklenmedik bir hata aldim: `lib.test.ts`, sadece saf bir fonksiyonu
(`repoyaDonustur`) test etmek istiyordu ama test calisir calismaz `process.exit(1)` ile
kapaniyordu. Sebebi: `lib.ts`, `config.ts`'i import ediyordu, `config.ts` da import
edildigi an (dosyanin en altinda `configYukle()` cagriliyor) token kontrolu yapiyordu.
Test ortaminda `GITHUB_TOKEN` olmadigi icin program hemen kapaniyordu.

Bu, bugunun konusunun tam ornegi: is mantigi (`repoyaDonustur`), aslinda hic ihtiyaci
olmayan bir bagimliliga (config/token) dolayli olarak bagli hale gelmisti. Cozum,
`GitHubRepoSemasi` ve `repoyaDonustur`'u `validation.ts` adinda, config'e hic dokunmayan
ayri bir dosyaya tasimak oldu. `lib.ts` hala bu fonksiyonlari disariya sunuyor
(`export { ... } from "./validation.js"`), ama test dosyam artik `validation.ts`'ten
import ediyor ve config'in hic calismasina gerek kalmiyor.

## 1. Dogrulama + Donusturme (Sahte API Cevabiyla)

Gercek GitHub'a hic istek atmadan, GitHub'in gercekte dondurdugu formata benzer sahte
bir obje kullandim:

```typescript
const sahteApiCevabi = {
  id: 12345,
  name: "ornek-repo",
  language: "TypeScript",
  stargazers_count: 250,
  html_url: "https://github.com/ornek/ornek-repo",
  owner: { login: "ornek" },   // kullanmadigimiz fazladan alan
  private: false,
};
```

Test, `stargazers_count -> stars` ve `html_url -> url` donusumlerinin dogru yapildigini,
fazladan alanlarin (owner, private) elenip elenmedigini ve `language: null` gibi ozel bir
durumun da dogru islendigini dogruluyor.

## 2. list Komutu Filtre Testi

Filtre mantigini `kosullariOlustur` adinda saf bir fonksiyona cikardim, sonra bellekte
gecici bir veritabani (`new Database(":memory:")`) kurup 3 ornek repo ekledim ve filtreleri
denedim:

```typescript
it("--language ile sadece o dildeki repolari suzmeli", () => {
  const db = testVeritabaniKur();
  const kosul = kosullariOlustur({ language: "TypeScript" });
  const sonuc = db.select().from(repos).where(kosul!).all();
  expect(sonuc).toHaveLength(2);
});
```

`:memory:` kullanmamin sebebi: gercek `repos.db` dosyasina dokunmadan, her testin
kendi temiz veritabaniyla baslamasini istedim. Boylece testler birbirini etkilemiyor
ve gercek verimi bozmuyor.

## 3. Upsert Testi

```typescript
it("ayni id'li kaydi iki kez islemek satir sayisini artirmamali", () => {
  const db = testVeritabaniKur();
  const repo = { id: 1, name: "test-repo", language: "TypeScript", stars: 10, url: "x", fetchedAt: "t1" };

  upsert(db, repo);
  upsert(db, repo);

  const tumKayitlar = db.select().from(repos).all();
  expect(tumKayitlar).toHaveLength(1);
});
```

Gun 15'te ayni seyi elle, iki kez `npm run sync` calistirip sayinin sabit kaldigini
gozle gorerek kanitlamistim. Simdi bu kontrol kalici bir test - bir daha upsert
mantigini bozacak bir degisiklik yapilirsa, test hemen kirmizi cikar.

## 4. Test Kapsami Raporu

```bash
npx vitest run --coverage
```

```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
config.ts           |       0 |        0 |       0 |       0
drizzle.config.ts   |       0 |        0 |       0 |       0
filtre.ts           |     100 |      100 |     100 |     100
lib.ts              |       0 |        0 |       0 |       0
main.ts             |       0 |        0 |       0 |       0
schema.ts           |     100 |      100 |     100 |     100
validation.ts       |     100 |      100 |     100 |     100
commands/list.ts    |       0 |        0 |       0 |       0
commands/sync.ts    |       0 |        0 |       0 |       0
```

Test yazdigim uc dosya (filtre.ts, validation.ts, schema.ts) %100 kapsamda. Digerleri
%0, ama bunun anlami hepsinin ayni derecede onemli oldugu degil.

### En Dusuk Kapsamli, Ama En Degerli Bosluk: commands/sync.ts

`main.ts` zaten cok az is yapiyor (sadece komutlari birlestiriyor), test etmenin getirisi
dusuk. `config.ts`'i Gun 16'da elle test etmistim (token silince ne oldugunu gordum).
Ama `commands/sync.ts` icinde gercek is mantigi var - `tumRepolariCek` (sayfalama
dongusu), `repolariDogrula`, `kaydet` - ve hicbiri test edilmemis. Bu, kapsam raporunun
gosterdigi en degerli bosluk.

### Buraya Hangi Testi Eklerdim?

`tumRepolariCek` fonksiyonu, gercek `fetch`'i cagiran `apiGet`'e bagimli. Bunu test etmek
icin gercek aga gitmek yerine `fetch`'i **taklit ederdim** (mock):

```typescript
import { vi } from "vitest";

it("sayfalama ile birden fazla sayfayi birlestirmeli", async () => {
  const sayfa1Cevabi = new Response(JSON.stringify([{ id: 1 }, { id: 2 }]), {
    headers: { link: '<https://api.github.com/orgs/x/repos?page=2>; rel="next"' },
  });
  const sayfa2Cevabi = new Response(JSON.stringify([{ id: 3 }]), {
    headers: {}, // son sayfa, "next" yok
  });

  global.fetch = vi.fn()
    .mockResolvedValueOnce(sayfa1Cevabi)
    .mockResolvedValueOnce(sayfa2Cevabi);

  const sonuc = await tumRepolariCek("test-org");

  expect(sonuc).toHaveLength(3);
  expect(global.fetch).toHaveBeenCalledTimes(2);
});
```

Bu test, `fetch`'in gercekte GitHub'a gitmesini engelleyip, onun yerine benim yazdigim
iki sahte cevabi donduruyor. Boylece "iki sayfa varsa, ikisini de gezip birlestiriyor mu"
sorusunu, gercek internet baglantisi olmadan, saniyeler icinde, her calistirmada ayni
sonucu vererek test edebilirdim.

Bunu bu odevde yazmadim cunku zaman kisitliydi ve upsert/filtre testleri daha temel
gorundu, ama coverage raporu bu boslugu net gosterdi - bu benim icin raporun asil
faydasi oldu: "hangi kodun hic dokunulmadigini" somut olarak gormek.

## Test Kapsaminin Olcmedigi Sey

Kapsam raporu bana "bu satir en az bir kez calisti mi" diyor, "bu satir **dogru**
calisti mi" demiyor. Ornegin `filtre.ts` %100 kapsamda ama bu, her olasi filtre
kombinasyonunu (bos, sadece language, sadece min-stars, ikisi birden) test ettigim
icin degil, testlerimin kodun her satirina en az bir kez ugramis olmasindan. Yuksek
kapsam, testlerimin kotu senaryolari (negatif stars, cok uzun dil ismi gibi) da
kapsadigi anlamina gelmiyor.

## Ogrendigim Kavramlar

- **Bagimliligin sizmasi**: saf gorunen bir fonksiyonun, import zincirinde gizli bir
  yan etkiye (config yukleme, dosya okuma) bagli olabilecegi
- **:memory: veritabani**: gercek dosyaya dokunmadan, her testte temiz bir veritabani
  kurma
- **Mock/fake**: gercek bir bagimliligi (fetch, dosya sistemi) sahte bir versiyonuyla
  degistirip, test edilen kodun kendisine odaklanma
- **Coverage raporu**: hangi kodun test edildigini, hangi kodun hic dokunulmadigini
  gorme; ama "calisti mi" ile "dogru calisti mi" arasindaki farki hatirlama