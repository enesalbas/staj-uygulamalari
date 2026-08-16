# HTTP Notlarim

Hafta Sonu Odevi 3. MDN'in HTTP Overview, HTTP Methods ve HTTP Status sayfalarini okuduktan
sonra tuttugum notlar, ve curl ile JSONPlaceholder uzerinde yaptigim denemeler.

## HTTP Metodlari Ne Zaman Kullanilir?

- **GET**: veri okumak icin. Sunucuda hicbir sey degistirmez (guvenli/safe). Ayni GET istegini
  kac kez tekrarlarsan tekrarla sonuc degismez (idempotent).
- **POST**: yeni bir kayit olusturmak icin. Her cagirdiginda yeni bir kayit olusturabilir,
  yani idempotent degil (ayni POST'u iki kez atarsan iki kayit olusabilir).
- **PUT**: bir kaydin tamamini degistirmek icin. Govdede gonderilmeyen alanlar silinir/sifirlanir.
  Idempotent: ayni PUT'u kac kez atarsan at, sonuc ayni olur.
- **PATCH**: bir kaydin sadece bir kismini guncellemek icin. Sadece gonderilen alanlar degisir,
  digerleri oldugu gibi kalir.
- **DELETE**: bir kaydi silmek icin. Idempotent: bir kere sildikten sonra tekrar silmeye
  calismak (kayit zaten yok oldugu icin) genelde hata vermez, sonuc ayni kalir.

Kisa kural: veri okumak -> GET, yeni olustur -> POST, tamamen degistir -> PUT, kismen
guncelle -> PATCH, sil -> DELETE.

## Durum Kodlarinin Anlamlari

| Kod | Anlami | Ne zaman gelir |
|---|---|---|
| 200 | OK | Istek basarili (GET, PUT, PATCH, DELETE'te tipik basari kodu) |
| 201 | Created | POST ile yeni bir kayit basariyla olusturuldu |
| 400 | Bad Request | Istek govdesi/parametreleri gecersiz, sunucu istegi anlayamadi |
| 401 | Unauthorized | Kimlik dogrulama eksik veya token gecersiz |
| 403 | Forbidden | Kimlik biliniyor ama bu islem icin yetki yok |
| 404 | Not Found | Istenen kaynak (URL) bulunamadi |
| 429 | Too Many Requests | Hiz sinirina takildin, bir sure bekleyip tekrar denemelisin |
| 500 | Internal Server Error | Sunucu tarafinda beklenmeyen bir hata olustu |

Genel mantik: 2xx basari, 4xx istemcinin hatasi (yanlis istek attin), 5xx sunucunun hatasi
(sunucuda bir seyler bozuldu).

401 ile 403 farki onemli: 401 "sen kimsin bilmiyorum", 403 "seni biliyorum ama izin yok".

## curl Denemelerim

### 1. Kullanici listesini cekme

```bash
curl https://jsonplaceholder.typicode.com/users
```

10 kullanicinin tam bilgisini (isim, email, adres, sirket) JSON dizisi olarak getirdi.
Varsayilan olarak curl GET istegi atar, baska bir sey belirtmeye gerek yok.

### 2. Tek kullanici cekme

```bash
curl https://jsonplaceholder.typicode.com/users/1
```

Tek bir kullaniciyi (id=1, Leanne Graham) dondurdu, dizi degil dogrudan obje olarak.

### 3. Olmayan id isteme

```bash
curl -i https://jsonplaceholder.typicode.com/users/999
```

Cikti:

```
HTTP/2 404
content-type: application/json; charset=utf-8
content-length: 2
...

{}
```

**Durum kodu 404, govde `{}` (bos obje).**

Ilk denememde sadece `curl` (header'siz) kullanmistim, gövdenin `{}` oldugunu görüp
"200 donuyor, JSONPlaceholder olmayan bir kaydi 404 ile degil bos govdeyle temsil
ediyor" diye yanlis bir sonuca varmistim. `curl -i` ile tekrar denedigimde durum
kodunun aslinda **404** oldugunu gordum - JSONPlaceholder tam da beklenen sekilde
davraniyormus.

Hatamin sebebi su: govdeye bakip durum kodu hakkinda hukum verdim, durum kodunun
kendisine hic bakmadim. Bu, asagida yazdigim "govde bos/farkli gorunse de kod hep
kontrol edilmeli" ilkesinin tam tersini yapmak oluyordu - dogru bir ilkeyi yanlis
uygulayarak yanlis bir sonuca vardim.

### 4. Response header'larini inceleme

```bash
curl -i https://jsonplaceholder.typicode.com/users/1
```

Onemli basliklar:

```
HTTP/2 200
content-type: application/json; charset=utf-8
cache-control: max-age=43200
etag: W/"1fd-+2Y3G3w049iSZtw5t1mzSnunngE"
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
x-ratelimit-reset: 1785428256
```

- **HTTP/2 200**: kullanilan protokol versiyonu ve durum kodu ayni satirda
- **content-type**: govdenin JSON oldugunu ve karakter kodlamasini (utf-8) belirtiyor
- **cache-control: max-age=43200**: bu cevap 43200 saniye (12 saat) onbellekte tutulabilir
- **etag**: govdenin bir "parmak izi". Icerik degismediyse sunucu bunu kullanip veriyi
  tekrar gondermeden "degismedi" diyebilir
- **x-ratelimit-***: Gun 14'teki GitHub API'sinde gordugum hiz siniri basliklarinin ayni
  turden bir ornegi. Burada limit 1000, 999 kaldi - yani JSONPlaceholder de arka planda
  bir hiz siniri uyguluyor, sadece varsayilan limitler cok yuksek oldugu icin normal
  kullanimda hic fark edilmiyor.

## Ogrendigim En Onemli Sey

Asil ogrendigim sey, ilk yazdigim halinden farkli cikti. JSONPlaceholder'in "/users/999"
icin davranisi aslinda **beklendigi gibi**: 404 donuyor, govdesi bos bir obje. Benim
ilk vardigim "bazi API'ler hata durumunu farkli temsil ediyor" sonucu yanlisti.

Yanlisin sebebi ogretici: `curl` (header'siz) sadece govdeyi gosteriyor, durum kodunu
gostermiyor. `{}` gorup dogrudan "200 donuyor" varsaydim, kontrol etmedim. Oysa ayni
notun 4. bolumunde `curl -i` kullanip durum kodunu goruyordum - 3. denemede de ayni
seyi yapsaydim hatayi hic yapmazdim.

Isin ironik tarafi su: vardigim yanlis sonucun kendisi bile "govde bos/farkli gorunse
de kod hep kontrol edilmeli" diye dogru bir ilkeye isaret ediyordu - ama o ilkeyi tam
da o deneyi yaparken uygulamamistim. Yani bir ilkeyi bilmek ile onu her seferinde
uygulamak farkli seyler. Bu durumu duzelttikten sonra, artik her API denemesinde
govdeye degil, once durum koduna (`curl -i` ya da esdegeri) bakma aliskanligini
pekistirdim.