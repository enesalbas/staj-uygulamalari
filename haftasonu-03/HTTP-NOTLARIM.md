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
curl https://jsonplaceholder.typicode.com/users/999
```

Cikti: `{}` (bos obje).

Beklentim 404 gormekti ama JSONPlaceholder'da GET ile olmayan bir kaydi istemek 404
DONDURMUYOR, bos bir obje ile 200 donuyor. Bu, JSONPlaceholder'in bir ozelligi/kisitliligi;
gercek API'lerin (ornegin Gun 14'te kullandigim GitHub API'si) cogu olmayan bir kaynak
icin gercekten 404 dondurur. Bu farki gorunce sunun onemini anladim: bir API'nin "basarisiz"
oldugunu anlamak icin sadece govdeye degil, durum koduna (status code) bakmak gerekiyor -
govde bos/farkli gorunse de kod hep kontrol edilmeli.

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

JSONPlaceholder'in "/users/999" icin bos obje + 200 donmesi beni sasirtti, cunku Gun 13 ve
Gun 14'te hep "basarisiz istek = hata kodu" varsayimiyla calismistim. Bu deneme gosterdi ki
bu varsayim her API icin gecerli degil; bazi sahte/basit API'ler hata durumunu farkli
temsil edebiliyor. Gercek bir API (GitHub gibi) ile calisirken durum kodunu kontrol etmek
sartti ve dogruydu, ama JSONPlaceholder gibi bir API ile calisirken de govdenin icerigini
kontrol etmek gerekebilecegini ogrendim - yani "basarili mi?" sorusunun cevabi API'den
API'ye degisebiliyor, tek bir kurala guvenmemek gerekiyor.