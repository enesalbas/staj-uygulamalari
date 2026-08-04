# Dogrulama Katmani

Staj Gun 16 odevi. GitHub'dan gelen veriyi veritabanina yazmadan once Zod ile dogruladim,
ortam degiskenlerini de ayni disiplinle kontrol eden bir config modulu yazdim.

## Neler Var

- **main.ts**: Gun 15'teki veri hattinin uzerine dogrulama katmani eklenmis hali
- **config.ts**: ortam degiskenlerini Zod ile dogrulayan modul
- **schema.ts**: Gun 11'den, veritabani semasi

## Kurulum ve Calistirma

```bash
npm install
cp .env.example .env   # GITHUB_TOKEN'ini ekle
npx drizzle-kit generate
npx drizzle-kit migrate
npx tsx --env-file=.env main.ts octokit
```

## 1. Dogrulama Semasi

```typescript
const GitHubRepoSemasi = z.object({
  id: z.number(),
  name: z.string().min(1),
  language: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  html_url: z.url(),
});
```

Her repo, veritabanina yazilmadan once bu semadan geciyor. `safeParse` kullandim (parse degil)
cunku gecersiz bir kayit programi cokertmemeli, sadece o kayit elenmeli:

```typescript
hamRepolar.forEach((repo, index) => {
  const sonuc = GitHubRepoSemasi.safeParse(repo);
  if (sonuc.success) {
    gecerliler.push(sonuc.data);
  } else {
    hatalar.push({ index, sebep: ... });
  }
});
```

## 2. Bilerek Bozuk Veri Testi

Gercek veriden birini `stargazers_count` alanini metne cevirerek, digerini `html_url`
alanini silerek bozdum ve calistirdim:

```
71 repo cekildi.
69 kayit gecti, 2 kayit elendi.
Elenen kayitlar:
  [0] stargazers_count: Invalid input: expected number, received string
  [1] html_url: Invalid input: expected string, received undefined
```

Program cokmedi, hangi kaydin hangi alaninda ne sorun oldugunu net soyledi ve kalan
69 kaydi normal sekilde kaydetti. Testten sonra bozma kodunu kaldirip temiz calistirmayi
tekrarladim, "0 kayit elendi" sonucunu aldim.

## 3. Config Modulu

```typescript
const ConfigSemasi = z.object({
  GITHUB_TOKEN: z.string().min(1, "GITHUB_TOKEN bos olamaz"),
  DB_PATH: z.string().default("repos.db"),
});
```

`GITHUB_TOKEN` zorunlu, bos string bile kabul edilmiyor. `DB_PATH` opsiyonel; ortam
degiskeni verilmezse Zod otomatik olarak `"repos.db"` kullaniyor.

Bu kontrol, dosya import edildigi an calisiyor. Token'i sildikten sonra test ettim:

```
HATA: Ortam degiskenleri gecersiz.
  GITHUB_TOKEN: Invalid input: expected string, received undefined
```

Program, veri cekmeye hic baslamadan, en bastan anlamli bir hatayla duruyor.

## Derleme Zamani Tipleri vs Calisma Zamani Dogrulama

Bu odevin en onemli sorusu buydu.

**Derleme zamani (compile-time) tip kontrolu**, TypeScript'in `.ts` dosyalarini kontrol
ederken yaptigi sey. `interface Repo { stars: number }` yazdigimda, kod **yazarken**
editor beni uyariyor: yanlis tipte bir deger atarsam kirmizi cizgi cikiyor.

Ama bu kontrol, kod **calisirken** hicbir sey yapmiyor. Sebebi basit: TypeScript
calismadan once JavaScript'e cevriliyor, ve bu cevirim sirasinda **butun tip bilgisi
siliniyor**. Yani derlenmis `.js` dosyasinda `interface`, `type` gibi hicbir sey kalmiyor.

Bunu kanitlayan sey su: API'den gelen veri, benim `interface Repo` tanimima uymayabilir
ama TypeScript bunu **hic bilemez**, cunku API'nin ne dondurecegini derleme aninda
tahmin edemez. `as Repo` yazip TypeScript'e "bana guven" dersem, o gercekten guveniyor -
kontrol etmiyor. Program calisirken `stars` alani `"cok"` gibi bir metin gelse bile,
TypeScript hicbir sey demez, cunku artik ortada TypeScript yok, sadece JavaScript var.

**Calisma zamani (runtime) dogrulama** ise tam bu bosluğu kapatiyor. Zod, programin
calistigi anda, gercek veriyle karsilastirarak kontrol yapiyor: "bu deger gercekten
sayi mi?" "bu alan gercekten var mi?" TypeScript'in aksine, bu kontrol calisma
zamaninda gercekten yapiliyor, sadece bir varsayim degil.

### Neden ikisi de gerekli?

Ikisi farkli sorunlari cozuyor:

- **Derleme zamani tipleri**, benim **kendi yazdigim kodun** icindeki hatalari
  yakaliyor. Ornegin bir fonksiyona yanlis tipte bir deger gecirmeye calisirsam,
  bunu hemen, kodu calistirmadan once goruyorum. Hizli geri bildirim veriyor,
  gelistirme surecini hizlandiriyor.

- **Calisma zamani dogrulama**, benim **kontrol edemedigim** veriyi (disaridan gelen
  API cevabi, kullanici girdisi, ortam degiskenleri) kontrol ediyor. Bu veri hakkinda
  derleme aninda hicbir garanti yok, cunku o veri henuz ortada yok - ancak program
  calisirken geliyor.

Kisa bir benzetme: derleme zamani tipleri, bir insaatin planinin dogru cizilmis olmasi
gibi. Calisma zamani dogrulama ise, insaata gelen malzemenin gercekten plana uygun
oldugunu, sahada olcerek kontrol etmek gibi. Plan dogru olsa bile, sahaya yanlis
malzeme gelebilir - onu ancak sahada olcerek anlarsin.

Bu odevde ikisini birlikte kullandim: `z.infer<typeof GitHubRepoSemasi>` ile Zod
semasindan TypeScript tipini **otomatik urettim**, boylece hem derleme zamaninda
(kod yazarken tip guvenligi) hem calisma zamaninda (gercek veriyi kontrol ederken)
ayni semayi tek yerden yonetmis oldum - iki kontrolu birbirinden ayri, tutarsiz
sekilde elde yazmak zorunda kalmadim.

## Ogrendigim Kavramlar

- **Zod semasi**: veri seklini hem tip hem calisma zamani kontrolu olarak tanimlama
- **safeParse vs parse**: hata firlatmadan kontrollu devam etme (Gun 6'daki
  "hatayi yutmadan ama coktermeden ele alma" mantiginin devami)
- **z.infer**: semadan otomatik TypeScript tipi uretme
- **unknown vs any**: disaridan gelen veriye "guvenmiyorum" demenin tip karsiligi
- **Config dogrulama**: ortam degiskenlerini de bir veri kaynagi olarak gorup ayni
  disiplinle (sema + varsayilan deger + net hata) ele alma