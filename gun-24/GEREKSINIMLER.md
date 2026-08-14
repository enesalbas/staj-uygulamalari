# RepoTakip - Gereksinimler

Bitirme projesi. Son 3 gunun (Gun 24-26) hedefi, staj boyunca yazilan parcalari
(istemci, dogrulama, ORM, CLI, log, test) tek bir tutarli uygulamada birlestirip
iki yeni komutla (stats, export) tamamlamak.

## Proje Ne Yapiyor?

RepoTakip, bir GitHub organizasyonunun (veya birden fazla organizasyonun) repolarini
cekip yerel bir veritabaninda saklayan, ozetleyen ve disari aktarabilen bir komut
satiri (CLI) araci.

## Hedef Kullanici

Kendi organizasyonlarindaki repolari takip etmek isteyen bir gelistirici ekibi (veya
takim lideri). Ornek senaryo: bir takim lideri, "organizasyonumuzdaki repolarin kacta
kaci TypeScript, en cok yildiz alan 5 repo hangisi" sorularini hizlica cevaplamak,
ve bu bilgiyi bir rapor olarak (JSON) baskalariyla paylasmak istiyor.

Kullanici teknik biri (terminal kullanmaya asina), ama RepoTakip'in ic isleyisini
(API, veritabani, dogrulama) bilmesine gerek yok - sadece komutlari calistirmasi
yeterli.

## Kapsam - Ne Var

- Bir veya birden fazla GitHub organizasyonunun public repolarini cekme (fetch)
- Cekilen veriyi Zod ile dogrulama, gecersiz kayitlari eleyip raporlama
- Veriyi SQLite'ta kalici olarak saklama (upsert ile, tekrar calistirma guvenli)
- Filtreli listeleme (dile gore, minimum yildiza gore)
- Ozet istatistik: dile gore dagilim, en yildizli repolar (stats)
- Veriyi JSON olarak disari aktarma (export)
- Ag hatalarina dayanikli istemci: zaman asimi, akilli yeniden deneme, es zamanlilik siniri
- Seviyeli, ortama gore formatli loglama
- Butun ic mantik icin birim ve entegrasyon testleri
- Linter ve formatter ile tutarli kod stili

## Kapsam - Ne Yok (Bilerek Disarida Birakilanlar)

- **Web arayuzu**: sadece CLI. Web arayuzu, bu projenin kapsaminin cok disinda,
  ayri bir proje olurdu.
- **Coklu kullanici / yetkilendirme**: RepoTakip tek bir kisinin/takimin kendi
  bilgisayarinda calistirdigi bir arac, sunucu tarafinda calisan, birden fazla
  kullanicinin ayni anda eristigi bir sistem degil.
- **Ozel (private) repo destegi**: sadece public repolar. Private repo icin ek
  token yetkisi ve guvenlik dusunceleri gerekir, kapsam disi birakildi.
- **GitHub disinda baska platformlar** (GitLab, Bitbucket vb.): sadece GitHub API'si.
- **Gercek zamanli guncelleme / webhook**: veri, kullanici `fetch` komutunu
  calistirdiginda guncelleniyor, otomatik/surekli senkronizasyon yok.
- **CSV export**: sadece JSON. CSV, ilerideki bir gelistirme olarak birakildi.

## Basari Olcutu

Proje su durumlarda basarili sayilir:

1. `repo-cli fetch <org>` calistirildiginda, o organizasyonun tum public repolari
   dogrulanip veritabanina kaydediliyor, ayni komut tekrar calistirilinca veri
   ciftlenmiyor (upsert calisiyor)
2. `repo-cli list --language X --min-stars Y` dogru filtrelenmis sonuclari donduruyor
3. `repo-cli stats` dile gore dagilimi ve en yildizli 5 repoyu doğru hesaplayip
   gosteriyor
4. `repo-cli export` veritabanindaki veriyi gecerli bir JSON dosyasina yaziyor
5. Butun bu komutlar, GitHub API'si gecici olarak yanit vermese (429/5xx) veya
   bozuk veri donse bile programi cokertmeden, anlamli hata mesajlariyla devam
   ediyor
6. `npm test` calistirildiginda tum testler geciyor, `npm run lint` sifir hata
   veriyor

## Komut Listesi (Taslak)

| Komut | Amaci (bir cumle) |
|---|---|
| `fetch <org...>` | Bir veya birden fazla organizasyonun repolarini GitHub'dan cekip dogrular ve veritabanina kaydeder |
| `list` | Veritabanindaki repolari, istege bagli dil/yildiz filtreleriyle listeler |
| `stats` | Kayitli repoların dile gore dagilimini ve en yildizli repolari ozetler |
| `export` | Veritabanindaki tum repo verisini bir JSON dosyasina aktarir |

`fetch`, onceki gunlerdeki `sync` komutunun yeniden adlandirilmis hali - "veri
cekip kaydetme" islemini daha acik anlatiyor, bitirme projesinde bu ismi kullanacagim.

## Hangi Gunlerin Parcalari Yeniden Kullanilacak

| Katman | Kaynak Gun | Notlar |
|---|---|---|
| GitHub istemcisi (api/) | Gun 14, 21 | Zaman asimi, akilli retry, sayfalama - degissiz kullanilacak |
| Es zamanlilik siniri (Semafor) | Gun 21 | fetch komutunda birden fazla org icin |
| Dogrulama (validation/) | Gun 16, 19 | Zod semasi + donusturme, testleriyle birlikte |
| Veritabani (db/, ORM) | Gun 11, 15, 19 | Drizzle semasi, upsert, filtre sorgusu |
| CLI (commands/) | Gun 18, 22 | Commander.js yapisi; stats ve export yeni eklenecek |
| Config | Gun 16, 20 | Zod ile dogrulanan ortam degiskenleri (token, DB yolu, log seviyesi) |
| Loglama | Gun 20 | Winston, ortama gore format |
| Test | Gun 17, 19 | Vitest, saf fonksiyonlar + bellekte veritabani ile test deseni |
| Katmanli mimari | Gun 22 | api/validation/db/commands/config/logging klasor yapisi aynen devam |
| Linter/formatter | Gun 23 | ESLint + Prettier yapilandirmasi tasinacak |

Yani bitirme projesinin cogu, onceki gunlerin dogrudan birlestirilmesi. Gercekten
yeni yazilacak kisimlar: `stats` komutu (ozet hesaplama mantigi) ve `export` komutu
(JSON'a yazma mantigi).

## En Buyuk 3 Risk ve Onlemler

### 1. Risk: GitHub hiz sinirina (rate limit) takilmak

Birden fazla organizasyon ic ice `fetch` edilirse, ya da proje test edilirken
sik sik calistirilirsa, GitHub'in saatlik istek limiti (kimlik dogrulanmis
istekler icin 5000) tukenebilir, butun sonraki istekler 429/403 donmeye baslar.

**Onlem:** Gun 21'de yazilan akilli retry (429/5xx'te ustel geri cekilmeyle
en fazla 3 deneme) ve es zamanlilik siniri (Semafor, en fazla 3 es zamanli
istek) zaten bu riski azaltiyor. Ek olarak, `fetch` komutunun basinda mevcut
rate limit durumunu (`x-ratelimit-remaining` basligi) loglayip kullaniciya
onceden uyari verebilirim.

### 2. Risk: GitHub'in dondugu veri semaya uymuyor (bozuk/beklenmedik veri)

GitHub API'si zamanla degisebilir, ya da bazi repolarda beklenmedik alanlar
(ornegin `language: null`, ya da hic olmayan bir alan) olabilir. Dogrulama
olmadan bu veri sessizce veritabanina yazilip sonradan `stats`/`export`
komutlarini bozabilir.

**Onlem:** Gun 16'da kurulan Zod dogrulama katmani zaten her kaydi kontrol
edip gecersiz olanlari eleyip raporluyor. Bunu koruyup, `stats` ve `export`
komutlarinin da sadece veritabanindaki (yani zaten dogrulanmis) veriyle
calismasini saglayacagim - boylece bu iki yeni komutun kendisi ekstra bir
dogrulama riski tasimiyor.

### 3. Risk: Veritabani bos veya hic senkronize edilmemisken stats/export calistirilmasi

Kullanici hic `fetch` calistirmadan direkt `stats` veya `export` calistirirsa,
bos bir tablo uzerinde anlamsiz sonuclar (or. "en yildizli 5 repo: []") ya da
cikti hic olmayan bir JSON dosyasi uretebilir - kullanici bunun bir hata mi
yoksa normal mi oldugunu anlayamayabilir.

**Onlem:** `stats` ve `export` komutlarinin basinda veritabaninda hic kayit
olup olmadigini kontrol edip, bos ise acik bir uyari verecegim: "Veritabaninda
hic repo yok. Once 'repo-cli fetch <org>' calistirin." Bu, Gun 18'deki
`list` komutunda zaten uyguladigim "Kriterlere uyan repo bulunamadi." mesaji
deseninin ayni mantikla genisletilmis hali.

## Sonraki Adim

Bu, cerceve dokumani. Detay tasarim (komutlarin tam CLI imzasi, stats'in
hangi metrikleri nasil hesaplayacagi, export'un JSON semasi) hafta sonu
tamamlanacak.