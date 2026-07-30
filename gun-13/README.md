# Ilk API Istemcim

Staj Gun 13 odevi. JSONPlaceholder API'siyle asenkron HTTP istekleri yaptim: veri cekme, ic ice istekler, sirali/paralel karsilastirmasi, POST/PATCH ve ortak hata yonetimi.

## Neler Var

- **main.ts**: bes bolumun tamami tek dosyada
  - Kullanici listesini cekip tablo halinde basma
  - Bir kullanicinin gonderilerini ve her gonderinin yorumlarini cekme (ic ice istekler)
  - Ayni isi once sirali sonra paralel yapip sureleri olcme
  - POST ile yeni gonderi olusturma, PATCH ile guncelleme
  - Basarisiz cevaplarda ozel hata firlatan `apiGet` yardimcisi

## Calistirma

```bash
npm run start gun-13/main.ts
```

Ek paket gerekmiyor; `fetch` Node 18'den beri yerlesik geliyor.

## apiGet Yardimcisi (5. madde)

Butun GET isteklerini tek bir fonksiyondan gecirdim:

```typescript
async function apiGet<T>(yol: string): Promise<T> {
  const cevap = await fetch(`${BASE_URL}${yol}`);

  if (!cevap.ok) {
    throw new ApiHatasi(cevap.status, yol);
  }

  return cevap.json() as Promise<T>;
}
```

**Neden gerekli:** `fetch`'in sasirtici bir davranisi var. 404 veya 500 gibi bir cevap geldiginde **hata firlatmiyor**. Istek teknik olarak basariyla tamamlandigi icin fetch bunu "basarili" sayiyor; sadece `response.ok` alanini `false` yapiyor.

Yani `ok` kontrolu yazmazsam, olmayan bir kaydi isteyip bos veriyle devam ederim ve bunu hic fark etmem. Bu tam olarak Gun 6'da ogrendigim "hata yutma" anti-pattern'i olurdu.

`ApiHatasi` sinifini da Gun 6'daki gibi `Error`'dan turettim, ama icine `durumKodu` ve `url` alanlarini ekledim. Boylece hatayi yakalarken hangi istegin hangi kodla basarisiz oldugunu biliyorum:

```
ApiHatasi yakalandi -> durum: 404, yol: /posts/999999
```

Generic olmasinin (`<T>`) faydasi: `apiGet<Kullanici[]>("/users")` yazinca donen deger `Kullanici[]` tipinde oluyor, her cagri kendi tipini tasiyor.

## Sirali vs Paralel (3. madde)

Bir kullanicinin 10 gonderisi var ve her gonderinin yorumlarini cekmem gerekiyor, yani 10 ayri istek.

### Sirali

```typescript
for (const gonderi of gonderiler) {
  const yorumlar = await apiGet<Yorum[]>(`/posts/${gonderi.id}/comments`);
  // ...
}
```

Dongudeki `await`, her istegin bitmesini bekliyor. Bir istek donmeden sonraki baslamiyor.

### Paralel

```typescript
const istekler = gonderiler.map(async (gonderi) => {
  const yorumlar = await apiGet<Yorum[]>(`/posts/${gonderi.id}/comments`);
  return { /* ... */ };
});

const sonuclar = await Promise.all(istekler);
```

`map` icindeki async fonksiyon **hemen calismaya basliyor** ama sonucunu beklemiyorum. `map` bittiginde elimde 10 tane baslatilmis ama henuz tamamlanmamis istek var; bunlara Promise deniyor.

`Promise.all` ise "bu 10 sozun hepsi tamamlanana kadar bekle" demek. Istekler zaten ayni anda yola cikmisti, burada sadece hepsinin donusunu bekliyorum.

### Olctugum sureler

| Yontem | Sure |
|---|---|
| Sirali | 649 ms |
| Paralel | 190 ms |

Yaklasik 3.4 kat fark. Ilk calistirmamda sirali sure 3696 ms cikmisti; sonraki calistirmalarda baglanti yeniden kullanildigi ve onbellek devreye girdigi icin dustu. Ama oran her seferinde korundu: paralel daima belirgin sekilde hizli.

### Farkin sebebi

Bir ag istegi beklerken program aslinda **hicbir sey yapmiyor**, sadece cevabin gelmesini bekliyor. Bu bekleme islemci gucuyle degil, ag gecikmesiyle ilgili.

- **Sirali**: toplam sure = isteklerin surelerinin **toplami**
- **Paralel**: toplam sure = **en yavas** istegin suresi

Benzetme: 10 mektup gonderecegim. Sirali yontem, birini postaya verip cevabi bekleyip sonra ikinciyi vermek. Paralel yontem, 10'unu birden postaya verip cevaplari beklemek.

### Her zaman paralel mi kullanmali?

Hayir. Paralel sadece istekler **birbirinden bagimsizsa** kullanilabilir. Burada her gonderinin yorumlari digerlerinden bagimsiz oldugu icin uygun.

Ama bir istegin sonucu digerinin girdisiyse sirali olmak zorunda. Ornegin once kullaniciyi cekip, sonra o kullanicinin id'siyle gonderilerini cekmem gerekiyordu; bu ikisi paralel yapilamaz.

Bir de cok fazla es zamanli istek sunucuyu zorlayabilir veya rate limit'e takilabilir. Yuzlerce istek varsa gruplar halinde gondermek daha dogru olur.

## POST ve PATCH (4. madde)

### POST

```typescript
const postCevap = await fetch(`${BASE_URL}/posts`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Staj Gun 13", body: "...", userId: 1 }),
});
```

Donen cevap:

```
durum: 201
{ title: 'Staj Gun 13', body: '...', userId: 1, id: 101 }
```

**201 Created** kodu, yeni bir kaynagin olusturuldugunu belirtiyor (basit 200 degil). Cevapta `id: 101` var; API'de 100 gonderi oldugu icin yenisi 101 numarayi aldi. JSONPlaceholder sahte bir API oldugu icin veriyi gercekten saklamiyor ama gercekmis gibi cevap donuyor.

### PATCH

```typescript
const patchCevap = await fetch(`${BASE_URL}/posts/1`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Guncellenmis baslik" }),
});
```

Donen cevap:

```
durum: 200
{ userId: 1, id: 1, title: 'Guncellenmis baslik', body: 'quia et suscipit...' }
```

En dikkat cekici nokta: sadece `title` gonderdim ama cevapta `body` de var ve **eski hali korunmus**. Kismi guncellemenin kaniti bu. PUT kullansaydim gondermedigim alanlar silinirdi.

| Metod | Ne yapar | Donen kod |
|---|---|---|
| GET | Veri okur | 200 |
| POST | Yeni kayit olusturur | 201 |
| PATCH | Kaydin bir kismini gunceller | 200 |
| PUT | Kaydin tamamini degistirir | 200 |

`Content-Type: application/json` basligi, sunucuya gonderdigim govdenin JSON oldugunu soyluyor. `JSON.stringify` de objeyi metne ceviriyor, cunku HTTP govdesi metin olmak zorunda (Gun 6'daki serialize isi).

## Ogrendigim Kavramlar

- **async/await**: bir istegin sonucunu beklemek, ama bu sirada programi bloklamamak
- **Promise**: "gelecekte bir deger olacak" sozu. `await` bu sozun gerceklesmesini bekliyor
- **Promise.all**: birden cok sozun hepsinin tamamlanmasini beklemek, istekler es zamanli devam ederken
- **fetch ve response.ok**: fetch HTTP hata kodlarinda kendiliginden hata firlatmiyor, kontrolu elle yapmak gerekiyor
- **HTTP metodlari**: GET, POST, PATCH, PUT ve hangi durum kodlarini donduklari
- **Ortak yardimci fonksiyon**: hata kontrolunu tek yerde toplayip her istekte tekrarlamamak
- **Sirali vs paralel**: bagimsiz istekleri es zamanli baslatmanin ciddi hiz kazandirdigi, ama bagimli isteklerde bunun mumkun olmadigi