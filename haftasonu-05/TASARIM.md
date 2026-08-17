# RepoTakip - Tasarim

Gun 24'teki GEREKSINIMLER.md'nin uzerine, uygulamaya baslamadan once detay tasarim.

Bu belge geri bildirim #6'daki gozden gecirmeden sonra guncellendi: stats'a yuzde ve
son fetch zamani eklendi, 429 satiri test edilen davranisla eslesecek sekilde
duzeltildi, transaction ve 403/Retry-After kararlari eklendi.

## 1. Komut Tasarimi

### fetch <org...>

Bir veya birden fazla GitHub organizasyonunun repolarini cekip dogrular, veritabanina
kaydeder (upsert).

```bash
repo-cli fetch octokit
repo-cli fetch octokit vercel expressjs
```

**Option'lar:** yok (su asama icin). Ileride `--concurrency <n>` gibi bir ayar
eklenebilir ama simdilik Semafor limiti (3) sabit kalacak.

**Beklenen cikti (basari):**
```
[10:00:00] info: Toplu senkronizasyon basladi {"orgSayisi":1,"esZamanliLimit":3}
[10:00:00] info: Senkronizasyon basladi {"org":"octokit"}
[10:00:01] info: Repolar cekildi {"org":"octokit","adet":71}
[10:00:01] info: Dogrulama tamamlandi {"org":"octokit","gecen":71,"elenen":0}
[10:00:01] info: Kayit tamamlandi {"org":"octokit","yazilan":71}
[10:00:01] info: Toplu senkronizasyon tamamlandi
```

**Beklenen cikti (org bulunamadi):**
```
[10:00:00] error: Kalici hata, yeniden denenmiyor {"durumKodu":404,"url":"..."}
HATA: Organizasyon bulunamadi: bu-org-yok
```

**Kayit asamasinin transaction karari:** `fetch` sirasinda bir organizasyonun
repolari tek bir veritabani transaction'i icinde yaziliyor (`db.transaction(...)`).
Yani "4000. kayitta yazma hatasi olursa ne olur" sorusunun cevabi: o organizasyonun
**hicbir** kaydi yazilmaz, transaction geri aliniyor (rollback). Kismi/yarim
senkronizasyon durumuna hic girilmiyor - ya organizasyonun tum gecerli kayitlari
yazilir ya hicbiri. Bunun sebebi: yarim yazilmis bir organizasyon, "bu veri guncel
mi eksik mi" sorusunu kullaniciya sessizce birakirdi; tumu-ya-da-hicbiri kurali bu
belirsizligi ortadan kaldiriyor. Birden fazla org ayni `fetch` cagrisinda isleniyorsa,
her org kendi bagimsiz transaction'ina sahip - biri basarisiz olsa digerleri
etkilenmiyor.

### list

Veritabanindaki repolari, istege bagli filtrelerle listeler.

```bash
repo-cli list
repo-cli list --language TypeScript
repo-cli list --min-stars 100
repo-cli list --language TypeScript --min-stars 100
repo-cli list --sort stars
repo-cli list --sort name
```

**Option'lar:**
- `--language <dil>` (opsiyonel) - sadece bu dildeki repolar
- `--min-stars <sayi>` (opsiyonel) - en az bu kadar yildizi olanlar
- `--sort <alan>` (opsiyonel, varsayilan: `stars`) - `stars` (azalan) veya `name` (artan)

**Beklenen cikti (sonuc var):** isim/dil/yildiz/url sutunlu tablo + "Toplam: N repo"

**Beklenen cikti (sonuc yok):** "Kriterlere uyan repo bulunamadi."

### stats

Kayitli repolarin ozetini gosterir: dile gore dagilim (yuzdeyle), en yildizli 5 repo,
ve son fetch zamani.

```bash
repo-cli stats
```

**Option'lar:** yok (ilk surumde). Ileride `--org <org>` ile tek organizasyona
daraltma eklenebilir.

**Beklenen cikti:**
```
=== Dillere Gore Dagilim ===
TypeScript: 36 (%50.7)
JavaScript: 13 (%18.3)
Python: 8 (%11.3)
...

=== En Yildizli 5 Repo ===
1. octokit.js (TypeScript) - 7830 yildiz
2. core.js (TypeScript) - 1282 yildiz
...

Toplam repo: 71
Son fetch: 2026-08-17T10:00:00.000Z
```

**Yuzde hesabi:** `(dildeki repo sayisi / toplam repo) * 100`, bir ondalik basamaga
yuvarlanmis. Toplam repo sifirsa yuzde hesaplanmiyor (asagidaki bos veritabani
durumuna dusuluyor).

**Son fetch zamani:** veritabanindaki tum kayitlarin `fetched_at` alaninin en
buyugu (`MAX(fetched_at)`). Kullaniciya "bu veri ne kadar guncel" bilgisini veriyor.

**Beklenen cikti (veritabani bos):**
```
Veritabaninda hic repo yok. Once 'repo-cli fetch <org>' calistirin.
```

### export

Veritabanindaki tum repo verisini bir JSON dosyasina yazar.

```bash
repo-cli export
repo-cli export --out disa-aktarilan.json
```

**Option'lar:**
- `--out <dosya>` (opsiyonel, varsayilan: `export.json`) - cikti dosyasinin adi

**JSON semasi:**
```json
{
  "olusturmaTarihi": "2026-08-15T10:00:00.000Z",
  "toplamRepo": 71,
  "repolar": [
    {
      "id": 1234,
      "name": "octokit.js",
      "language": "TypeScript",
      "stars": 7830,
      "url": "https://github.com/octokit/octokit.js",
      "fetchedAt": "2026-08-15T09:55:00.000Z"
    }
  ]
}
```

`olusturmaTarihi` ve `toplamRepo` alanlarini ekliyorum ki, disari aktarilan
dosyayi acan biri (rapor olarak paylasilacaksa) verinin ne zaman alindigini
ve kac kayit oldugunu ekstra bir hesaplama yapmadan gorsun.

**Beklenen cikti (basari):**
```
71 repo export.json dosyasina yazildi.
```

**Beklenen cikti (veritabani bos):**
```
Veritabaninda hic repo yok. Once 'repo-cli fetch <org>' calistirin.
```

## 2. Veritabani Semasi

Tek tablo, Gun 11-15'ten degismeden devam ediyor:

```
repos
┌────────────┬─────────┬──────────┬─────────────────────────┐
│ Sutun      │ Tip     │ Kisit    │ Aciklama                │
├────────────┼─────────┼──────────┼─────────────────────────┤
│ id         │ INTEGER │ PK       │ GitHub'in kendi repo id'si │
│ name       │ TEXT    │ NOT NULL │ Repo adi                │
│ language   │ TEXT    │ -        │ Ana dil, null olabilir  │
│ stars      │ INTEGER │ NOT NULL │ Yildiz sayisi           │
│ url        │ TEXT    │ NOT NULL │ GitHub URL'i             │
│ fetched_at │ TEXT    │ NOT NULL │ Son cekilme zamani (ISO)│
└────────────┴─────────┴──────────┴─────────────────────────┘
```

Iliski yok - tek tablo. Bitirme projesi kapsaminda (organizasyon bazinda ayrim,
commit/MR takibi gibi) ek tablo gerektirecek bir ozellik planlanmiyor; GEREKSINIMLER.md'de
bu bilerek kapsam disi birakildi.

**Olasi ileri gelistirme (simdilik yapilmayacak):** `organizations` tablosu eklenip
`repos.org_id` ile iliskilendirilebilir, boylece `stats --org <org>` gibi bir filtre
kolaylasir. Simdilik `repos` tablosunda organizasyon bilgisi tutulmadigi icin
(sadece tum repolar tek havuzda) bu ozellik yok.

## 3. Klasor Yapisi

Gun 22'deki katmanli mimari aynen devam ediyor, iki yeni komut dosyasi ekleniyor:

```
repo-takip/
  api/
    github-client.ts   - fetch, retry, timeout, sayfalama (Gun 14, 21)
    semafor.ts          - es zamanlilik siniri (Gun 21)
  validation/
    github-repo.ts      - Zod semasi, dogrulama, donusturme (Gun 16, 19)
  db/
    schema.ts            - Drizzle tablo tanimi (Gun 11)
    client.ts            - veritabani baglantisi (Gun 22)
    query-builder.ts     - saf filtre/sorgu mantigi (Gun 19, 22)
    repository.ts        - kaydetme/okuma/upsert/ozet, DI ile (db parametre olarak alinir)
  commands/
    fetch.ts             - YENI (eskiden sync.ts, isim degisti)
    list.ts               - mevcut (Gun 18, 22)
    stats.ts              - YENI
    export.ts             - YENI
  config/
    config.ts            - tum ortam degiskenleri (Gun 16, 20)
  logging/
    logger.ts            - Winston, ortama gore format (Gun 20)
  main.ts                 - giris noktasi, komutlari birlestirir
  eslint.config.js        - Gun 23
  .prettierrc.json        - Gun 23
```

**Yeni dosyalarin sorumlulugu:**
- `commands/stats.ts` - sadece CLI katmani. `db/repository.ts`'e yeni bir
  `reposuOzetle()` fonksiyonu eklenecek (dile gore gruplama + yuzde + siralama +
  son fetch zamani), stats.ts bunu cagirip basacak.
- `commands/export.ts` - sadece CLI katmani. `db/repository.ts`'teki
  `reposuListele({})` ile veriyi cekip JSON'a yazacak.

Boylece stats/export komutlari da, fetch/list gibi, "ince CLI, agir is alt
katmanda" kuralina uyuyor.

## 4. Test Plani

| Katman | Test turu | Nasil |
|---|---|---|
| `validation/github-repo.ts` | Birim testi | Sahte API cevabiyla (gercek agsiz), gecerli/gecersiz veri senaryolari |
| `db/query-builder.ts` | Birim testi | Saf fonksiyon, veritabanina hic dokunmadan test |
| `db/repository.ts` (upsert, filtre, siralama, ozet) | Entegrasyon testi | Bellekte (`:memory:`) SQLite ile, gercek dosyaya dokunmadan; fonksiyonlar `db`'yi disaridan parametre olarak aldigi icin (DI) gercek uretim kodu test ediliyor, kopyasi degil |
| `api/github-client.ts` | Entegrasyon testi (mock ile) | `fetch`'i `vi.stubGlobal` ile taklit edip sayfalama/retry/timeout davranisini test etme - Gun 25'te yazildi, tum senaryolar (429->basari, 3x500->hata, 404->tek deneme, sayfalama) gecti |
| `commands/*.ts` | Yazilmayacak | CLI katmani ince oldugu icin (sadece cagri yapiyor), ayri test degeri dusuk - alt katmanlar test edildigi icin CLI'nin dogrulugu dolayli olarak garanti ediliyor |

**Yeni eklenecek testler (Gun 26):**
1. `db/repository.test.ts`'e eklenecek - `reposuOzetle()` fonksiyonu icin: dogru
   dile gore gruplama, dogru yuzde hesabi, dogru siralama, dogru son fetch zamani,
   bos veritabaninda bos sonuc

## 5. Hata Senaryolari

| Senaryo | Kullanici Ne Gormeli |
|---|---|
| Token eksik/gecersiz (.env yok veya bozuk) | Program hemen baslangicta durur: "HATA: Ortam degiskenleri gecersiz. GITHUB_TOKEN: ..." (Gun 16 config dogrulamasi) |
| Organizasyon bulunamadi (404) | "Organizasyon bulunamadi: <org>" - programin geri kalani (varsa diger orglar) devam eder |
| GitHub hiz sinirina takildi (429) | Toplam 3 deneme (1 asil istek + 2 yeniden deneme), ustel geri cekilmeyle; hala basarisizsa "3 denemede de basarisiz oldu" |
| GitHub sunucu hatasi (5xx) | Ayni sekilde toplam 3 deneme; 3 denemede de olmazsa anlamli hata |
| Ag zaman asimi (10sn'de cevap yok) | "Istek zaman asimina ugradi (10000ms): <url>" |
| API'den gelen veri semaya uymuyor | O tek kayit elenir, digerleri kaydedilir, sonunda "X kayit gecti, Y kayit elendi" + hangi kaydin neden elendigi loglanir |
| list/stats/export calistirilirken veritabani bos | "Veritabaninda hic repo yok. Once 'repo-cli fetch <org>' calistirin." |
| export icin --out ile verilen klasor yoksa | Dosya yazma hatasi yakalanip "Dosya yazilamadi: <sebep>" seklinde raporlanir (henuz belirlenmemis detay - export.ts yazilirken netlesecek) |
| Ayni fetch komutu iki kez calistirilirsa | Veri ciftlenmez (upsert), kayit sayisi ayni kalir - Gun 15'te kanitlanmis davranis |
| Bir organizasyonun kaydi sirasinda yazma hatasi olursa | O organizasyonun hicbir kaydi veritabaninda kalmaz (transaction rollback); diger organizasyonlar etkilenmez |
| GitHub birincil hiz sinirini 403 ile dondurur (`x-ratelimit-remaining: 0`) | 403, `x-ratelimit-remaining: 0` basligiyla birlikte geldiginde gecici sayilir ve `Retry-After` (ya da `x-ratelimit-reset`) basligina gore hesaplanan sure kadar beklenip yeniden denenir; ayni 429 gibi toplam 3 deneme |

**403 karari - neden onemli:** GitHub gercek hayatta birincil hiz limitini
cogunlukla 429 degil, **403 + `x-ratelimit-remaining: 0`** basligiyla donduruyor.
Mevcut `geciciHataMi` fonksiyonu 403'u kalici sayip hic denemeden vazgeciyordu -
bu, GEREKSINIMLER.md'deki 1. riskin (rate limit) tam onlemeye ihtiyaci olan kismi.
Duzeltme: 403 geldiginde `x-ratelimit-remaining` basligi "0" ise gecici say (429
gibi davran), degilse (gercek yetki sorunuysa) kalici say. Bekleme suresi icin
`Retry-After` basligi varsa onu, yoksa `x-ratelimit-reset` (Unix zaman damgasi)
basligindan hesaplanan sureyi kullan - sabit ustel bekleme yerine sunucunun
soyledigi sureyi beklemek daha kibar bir istemci davranisi.

## Sonraki Adim

Bu tasarim, geri bildirim #6'nin gozden gecirmesinden sonra guncellendi ve Gun 25'te
uygulamaya gecildi: katmanli iskelet kuruldu, `fetch` ve `list` komutlari (siralama
dahil) bitirildi, `api/`, `validation/`, `db/` katmanlari testlerle birlikte yazildi.
Gun 26'da `stats` ve `export` komutlari, transaction sarmalama ve 403/Retry-After
davranisi eklenecek.