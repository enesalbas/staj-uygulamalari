# Ilk Testlerim

Staj Gun 17 odevi. Vitest ile ilk birim testlerimi yazdim. Gun 3'teki koleksiyon
fonksiyonlarini ve Gun 4/6'daki banka mantigini saf fonksiyonlara ayirip test ettim,
Gun 16'daki dogrulama semasini da test ettim.

## Neler Var

- **banka.ts / banka.test.ts**: Gun 4/6'daki bakiye guncelleme mantigi, saf fonksiyona
  ayrilmis hali ve testleri
- **satislar.ts / satislar.test.ts**: Gun 3'teki gruplama ve en pahali urun bulma
  fonksiyonlari ve testleri
- **dogrulama.ts / dogrulama.test.ts**: Gun 16'daki Zod semasi ve testleri

## Calistirma

```bash
npm install
npx vitest run
```

## Neden Saf Fonksiyona Ayirdim?

Gun 4'teki `paraCek` metodu, sinifin icindeki `this.bakiye`'yi degistiriyordu. Bunu test
etmek icin once bir `BankaHesabi` nesnesi kurmam, sonra metodu cagirmam, sonra private
bir alana nasilsa erisip kontrol etmem gerekirdi - test yazmak zorlasiyordu cunku fonksiyon
disaridaki bir seye bagimliydi.

Saf fonksiyon, ayni girdiyi verdiginde her zaman ayni cikti veren, disaridaki hicbir seyi
degistirmeyen fonksiyon:

```typescript
export function bakiyeGuncelle(mevcutBakiye: number, tutar: number, islem: "yatirma" | "cekme"): number {
  if (tutar <= 0) throw new GecersizTutarHatasi("Tutar pozitif olmali");
  if (islem === "cekme" && tutar > mevcutBakiye) throw new YetersizBakiyeHatasi("Yetersiz bakiye");
  return islem === "yatirma" ? mevcutBakiye + tutar : mevcutBakiye - tutar;
}
```

Ayni kontroller, ama artik `this` yok, sinif yok. Sadece "bakiye + tutar + islem turu ver,
yeni bakiyeyi al." Test etmek kolaylasti cunku hicbir kurulum gerekmiyor.

## AAA Deseni

Her testim ayni yapiyi takip ediyor:

```typescript
it("normal yatirma bakiyeyi arttirmali", () => {
  // Arrange: test verisini hazirla (burada parametreler zaten satirda)
  // Act: fonksiyonu cagir
  const sonuc = bakiyeGuncelle(1000, 500, "yatirma");
  // Assert: sonucu dogrula
  expect(sonuc).toBe(1500);
});
```

## Kenar Durumlar (Edge Case)

Her fonksiyon icin normal duruma ek olarak en az 2 kenar durum test ettim:

- **bakiyeGuncelle**: negatif tutar, sifir tutar, yetersiz bakiye
- **kategoriyeGoreCiro**: bos liste
- **enPahaliUrun**: bos liste (null donmeli), tek elemanli liste
- **GitHubRepoSemasi**: eksik zorunlu alan, yanlis tip, gecerli null deger (language icin)

## Hata Firlatma Testi

```typescript
expect(() => bakiyeGuncelle(1000, -50, "yatirma")).toThrow(GecersizTutarHatasi);
```

Dikkat ettigim nokta: `expect(bakiyeGuncelle(...))` degil `expect(() => bakiyeGuncelle(...))`
yazdim. Fonksiyonu dogrudan cagirsaydim, hata testin kendisini calistirirken firlar ve test
cokerdi. `() => ...` ile Vitest'e "bunu sen cagir, hatayi sen yakala" demis oluyorum.

## Bu Testlerden Biri Gelecekte Hangi Hatayi Yakalardi?

En degerli buldugum test su:

```typescript
it("bakiyeden fazla cekmeye calisinca hata firlatmali", () => {
  expect(() => bakiyeGuncelle(100, 500, "cekme")).toThrow(YetersizBakiyeHatasi);
});
```

Diyelim altı ay sonra, birisi (belki ben) performans icin `bakiyeGuncelle`'i "optimize
ediyorum" derken su kontrolu yanlislikla degistirdi:

```typescript
if (islem === "cekme" && tutar >= mevcutBakiye) {  // > yerine >= yazildi
```

Bu degisiklik, bakiyenin tam esit oldugu durumda (mesela 100 TL bakiyeden 100 TL cekmek)
artik hatali sekilde "yetersiz bakiye" hatasi firlatir - oysa bu gecerli bir islem olmali.
Testi calistirmasam bu hatayi fark etmezdim, cunku kod hala "calisiyor" gorunur, sadece
yanlis bir kuralı uyguluyor. Test dosyasi `npx vitest run` ile calisinca bu satir hemen
kirmizi cikar ve "bakiyeden fazla cekmeye calisinca hata firlatmali" testi (ya da yeni bir
esitlik testi eklersem o) beni uyarir.

Bu tur hatalara **regresyon** deniyor: onceden dogru calisan bir sey, sonradan yapilan bir
degisiklikle bozuluyor. Testler olmasaydi bu hatayi ancak production'da bir kullanici
sikayet edince fark ederdim.

## "Test Yazmak Zaman Kaybi mi?" Sorusuna Cevabim

Kisa vadede evet, zaman aliyor - 14 test yazmak, direkt "calisir umarim" deyip gecmekten
daha uzun surdu. Ama bu soruyu dogru soru olarak gormuyorum artik.

Su ana kadar 16 gundur bir seyi test etmenin tek yolu "calistir, ciktiya bak, gozle
dogrula" idi. Bu is gordu ama **kalici degildi**: kodu bir hafta sonra degistirdigimde,
eski kontrolleri hatirlayip tekrar elle yapmam gerekiyordu. Cogu zaman yapmiyordum,
sadece "degistirdigim kisim calisiyor mu" diye bakiyordum, dokunmadigim kisimlarin hala
dogru davrandigini varsayiyordum.

Test yazinca bu varsayim ortadan kalkiyor. Bir defa yazdigim kontrol, bundan sonraki
her degisiklikte otomatik calisiyor. Yani zaman, "yazarken" harcaniyor ama "her
calistirmada elle kontrol etmek" zamanindan cok daha az. Ozellikle Gun 16'daki
dogrulama semasi gibi kritik bir yerde - yanlis calissaydi bozuk veri sessizce
veritabanina girerdi - testin orada durup "hayir, bu senaryo hala dogru calisiyor mu"
diye sormasi bana guven veriyor.

Kisaca: test yazmak zaman kaybi degil, zamanin ne zaman harcandigini degistiriyor.
Hatayi "yillar sonra kullanici sikayet edince" bulmak yerine, "degisikligi yaptigim an"
bulmayi sagliyor.

## Ogrendigim Kavramlar

- **Birim testi**: bir fonksiyonu izole edip beklenen ciktiyi otomatik dogrulama
- **Saf fonksiyon**: disaridaki durumu degistirmeyen, ayni girdiye ayni cikti veren fonksiyon
- **AAA deseni**: Arrange (hazirla) - Act (uygula) - Assert (dogrula)
- **Kenar durum (edge case)**: bos liste, sifir, negatif deger gibi sinir durumlari
  dusunup test etme
- **toBe vs toEqual**: basit degerler icin toBe, obje/dizi icerik karsilastirmasi icin toEqual
- **expect(() => ...).toThrow()**: hata firlatan kodu güvenli sekilde test etme
- **Regresyon**: onceden dogru calisan bir seyin, sonraki bir degisiklikle bozulmasi