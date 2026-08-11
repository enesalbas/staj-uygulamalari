# Dayanikli Istemci

Staj Gun 21 odevi. Gun 14'teki GitHub istemcisine zaman asimi, akilli yeniden deneme
(retry) ve es zamanlilik siniri ekledim.

## Neler Var

- **lib.ts**: `apiGet` artik `AbortController` ile zaman asimi, gecici hatalarda ustel
  geri cekilmeli yeniden deneme yapiyor
- **semafor.ts**: aynı anda en fazla N isin calismasina izin veren basit kuyruk
- **commands/sync.ts**: artik birden fazla organizasyonu, semafor ile sinirlanmis
  es zamanlilikta isliyor

## Kurulum ve Calistirma

```bash
npm install
cp .env.example .env   # GITHUB_TOKEN ekle
npx drizzle-kit generate
npx drizzle-kit migrate
```

```bash
npx tsx --env-file=.env main.ts sync octokit                      # tek org
npx tsx --env-file=.env main.ts sync octokit vercel expressjs     # birden fazla org
```

## 1. Zaman Asimi (Timeout)

```typescript
async function fetchZamanAsimliyla(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ZAMAN_ASIMI_MS);

  try {
    return await fetch(url, { signal: controller.signal, headers: {...} });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new GitHubApiHatasi(0, `Istek zaman asimina ugradi (${ZAMAN_ASIMI_MS}ms): ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
```

`AbortController`, `fetch`'e "istegi iptal etme sinyali" veren bir nesne. `setTimeout` ile
`ZAMAN_ASIMI_MS` (10 saniye) sonra `controller.abort()` cagriliyor; sunucu o ana kadar
cevap vermediyse, `fetch` `AbortError` firlatiyor, ben de onu anlamli bir mesaja ceviriyorum.

Bunu, kucuk bir zaman asimiyla gercek bir istekte test ettim: `fetchWithTimeout(url, 1)`
(1 milisaniye) verince beklendigi gibi "zaman asimina ugradi" hatasi aldim, normal sureyle
(10 saniye) verince istek basariyla tamamlandi.

Neden onemli: timeout olmadan, sunucu hic cevap vermezse (ag sorunu, sunucu donmasi gibi)
program **sonsuza kadar bekler**. Bu, tek bir kotu istegin butun programi kilitlemesi
demek.

## 2. Akilli Yeniden Deneme (Retry)

```typescript
function geciciHataMi(durumKodu: number): boolean {
  return durumKodu === 429 || durumKodu >= 500;
}
```

Hangi hatalarda retry yaptim, hangilerinde yapmadim:

**Yeniden deniyorum (gecici hatalar): 429, 5xx**
- 429 = hiz sinirina takildim, birkac saniye sonra limit sifirlanabilir
- 5xx (500, 502, 503...) = sunucu tarafinda gecici bir sorun, birazdan duzelebilir

**Yeniden denemiyorum (kalici hatalar): 401, 404**
- 401 = token gecersiz. Tekrar denesem de token degismedigi surece yine 401 gelir
- 404 = organizasyon yok. Tekrar denesem de organizasyon var olmayacak

Farki koda da yansittim - gecici hatada `logger.warn` (henuz pes etmedim, deniyorum),
kalici hatada `logger.error` (bu is bitti, tekrar denemenin anlami yok):

```typescript
if (geciciHataMi(cevap.status)) {
  logger.warn("Gecici hata, yeniden deneniyor", { durumKodu: cevap.status, deneme, bekleMs, url });
  // ... bekle, tekrar dene
} else {
  logger.error("Kalici hata, yeniden denenmiyor", { durumKodu: cevap.status, url });
  throw new GitHubApiHatasi(...);
}
```

### Ustel Geri Cekilme (Exponential Backoff)

```typescript
const bekleMs = 1000 * 2 ** (deneme - 1);
```

1. deneme basarisizsa 1 saniye bekle, 2. deneme basarisizsa 2 saniye, 3. deneme
basarisizsa 4 saniye - her seferinde iki katina cikiyor. En fazla 3 deneme (`MAX_DENEME`),
3. denemede de basarisiz olursa artik pes edip hata firlatiyorum.

Sabit bir bekleme suresi (mesela hep 1 saniye) yerine ustel artan sure kullanmamin
sebebi: sunucu zaten zorlaniyorsa (429/5xx aliyorsam), hemen ve sik sik tekrar
denemek durumu kotulestirir - herkes ayni anda tekrar deneyip sunucuyu daha da
zorlar. Artan bekleme suresi, sunucuya "toparlanma payi" veriyor.

## 3. Es Zamanlilik Siniri (Semafor)

```typescript
export class Semafor {
  private aktif = 0;
  private bekleyenler: (() => void)[] = [];

  constructor(private readonly limit: number) {}

  async calistir<T>(is: () => Promise<T>): Promise<T> {
    if (this.aktif >= this.limit) {
      await new Promise<void>((resolve) => this.bekleyenler.push(resolve));
    }
    this.aktif++;
    try {
      return await is();
    } finally {
      this.aktif--;
      const sonraki = this.bekleyenler.shift();
      if (sonraki) sonraki();
    }
  }
}
```

`aktif`, su an calisan is sayisini tutuyor. Limit dolmus haldeyken yeni bir is gelirse,
o is bir `Promise` ile "sirada bekliyorum" durumuna giriyor; is bittiginde (`finally`),
sıradaki bekleyen uyandiriliyor.

Kullanimi:

```typescript
const semafor = new Semafor(3);
await Promise.all(
  orgs.map((org) => semafor.calistir(() => tekOrgSenkronizeEt(org)))
);
```

### Kanit

3 organizasyonla (limit de 3 oldugu icin hepsi ayni anda baslayabildi) test ettim:

```
[10:39:13] info: Toplu senkronizasyon basladi {"orgSayisi":3,"esZamanliLimit":3}
[10:39:13] info: Senkronizasyon basladi {"org":"octokit"}
[10:39:13] info: Senkronizasyon basladi {"org":"vercel"}
[10:39:13] info: Senkronizasyon basladi {"org":"expressjs"}
[10:39:14] info: Kayit tamamlandi {"org":"expressjs","yazilan":50}
[10:39:14] info: Kayit tamamlandi {"org":"octokit","yazilan":71}
[10:39:16] info: Kayit tamamlandi {"org":"vercel","yazilan":240}
```

Ucu de ayni saniyede ("10:39:13") basladi - sirali olsaydi aralarinda saniyeler
olurdu. Bitis sirasi ise veri boyutuna gore degisti (en kucuk veri - expressjs 50
repo - once bitti, en buyuk - vercel 240 repo - en son), bu da gercekten paralel
calistiklarinin kaniti.

### Sinirsiz Es Zamanlilik Neyi Bozardi?

Eger `Semafor` olmasaydi ve 20 organizasyonu ayni anda islemeye kalksaydim:

1. **Hiz sinirine daha hizli takilirdim.** GitHub'in saatlik istek limiti sabit;
   20 organizasyonu ayni anda cekmeye calismak, o limiti cok daha hizli tuketir ve
   429 hatalarini tetikler - ki bu da az once yazdigim retry mekanizmasini surekli
   calistirir, isi yavaslatir.

2. **Bellek ve baglanti sayisi patlar.** Her es zamanli istek, acik bir ag baglantisi
   ve bellekte tutulan veri demek. 20 organizasyonun hepsi ayni anda binlerce repo
   cekmeye calissa, sistem kaynaklari (acik soket sayisi, bellek) asiri kullanilabilir.

3. **Hata ayiklamasi zorlasir.** Log ciktisinda 20 organizasyonun mesajlari birbirine
   karisir, hangi hatanin hangi organizasyona ait oldugunu takip etmek zorlasir.

Semafor, "ayni anda cok fazla is baslatma" disiplinini kod seviyesinde zorunlu kiliyor -
kac organizasyon verirsem vereyim, sistem her zaman en fazla 3 tanesiyle ayni anda
ugrasiyor, geri kalanlar sirada bekliyor.

## Ogrendigim Kavramlar

- **AbortController**: bir fetch istegini disaridan iptal etme mekanizmasi
- **Gecici vs kalici hata**: 429/5xx tekrar denemeye deger, 401/404 degil
- **Ustel geri cekilme (exponential backoff)**: her basarisiz denemede bekleme
  suresini katlayarak artirma, sunucuya toparlanma payi verme
- **Semafor**: aynı anda en fazla N isin calismasina izin veren, fazlasini
  siraya alan basit eszamanlilik kontrolu
- **Paralel ama sinirli**: `Promise.all` + semafor birlikte, hem hizli (paralel)
  hem kontrollu (sinirli) bir yapi kuruyor