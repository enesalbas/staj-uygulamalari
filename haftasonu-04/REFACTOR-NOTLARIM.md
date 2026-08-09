# Refactor Notlarim

Hafta Sonu Odevi 4. Refactoring.guru'da "What is Refactoring?" ve "Code Smells" bolumlerini
okuduktan sonra, Gun 6'daki `gun-06/main.ts` dosyasini sectim ve iki koku bulup duzelttim.

## Neden gun-06/main.ts?

Bu, stajin ilk haftasindan, kendi yazdigim gercek bir kod. O gunler kalicilik ve hata
yonetimini yeni ogreniyordum, ozellikle "hatali senaryolar" kismini yazarken ayni kontrolu
iki kez elle yazmistim. O zaman bunun bir sorun oldugunu fark etmemistim, simdi code smell
kavramini ogrenince nette gordum.

## Buldugum Kokular

### 1. Duplicate Code (Tekrar Eden Kod)

Dosyanin sonunda iki ayri `try/catch` blogu, birebir ayni `instanceof` zincirini
tekrarliyordu:

```typescript
// ONCESI
try {
  hesap2.paraCek(999999);
} catch (err) {
  if (err instanceof YetersizBakiyeHatasi) {
    console.error("Bakiye yetersiz:", err.message);
  } else if (err instanceof GecersizTutarHatasi) {
    console.error("Gecersiz tutar:", err.message);
  } else {
    console.error("Beklenmeyen hata:", (err as Error).message);
  }
}

try {
  hesap1.paraYatir(-100);
} catch (err) {
  if (err instanceof YetersizBakiyeHatasi) {
    console.error("Bakiye yetersiz:", err.message);
  } else if (err instanceof GecersizTutarHatasi) {
    console.error("Gecersiz tutar:", err.message);
  } else {
    console.error("Beklenmeyen hata:", (err as Error).message);
  }
}
```

12 satir, ama gercekte tek bir mantik: "bu hatayi tipine gore etiketli bir mesaja cevir."
Ayni kodu iki kez yazmis olmam, ileride birini degistirip digerini unutma riskini
yaratiyordu - mesela birine yeni bir hata tipi eklesem, otekine eklemeyi unutabilirdim.

### 2. Magic String Tekrarı / Sacilmis Sorumluluk

Ilk kokuyla baglantili ikinci bir gozlem: "Bakiye yetersiz:", "Gecersiz tutar:",
"Beklenmeyen hata:" gibi etiketler dogrudan `console.error` cagrilarinin icine
gomulmustu. Bu, "hata mesaji nasil formatlanir" bilgisinin, "hata ne zaman yakalanir"
bilgisiyle karismis olmasi demekti - iki farkli sorumluluk tek yerde.

## Uyguladigim Refactor

Refactoring.guru'nun "Extract Method" (metodu cikar) teknigini kullandim: tekrar eden
mantigi tek bir fonksiyona tasidim.

```typescript
// SONRASI - yeni fonksiyon
function hataMesajiUret(err: unknown): string {
  if (err instanceof YetersizBakiyeHatasi) {
    return `Bakiye yetersiz: ${err.message}`;
  }
  if (err instanceof GecersizTutarHatasi) {
    return `Gecersiz tutar: ${err.message}`;
  }
  return `Beklenmeyen hata: ${(err as Error).message}`;
}
```

```typescript
// SONRASI - kullanim yerleri
try {
  hesap2.paraCek(999999);
} catch (err) {
  console.error(hataMesajiUret(err));
}

try {
  hesap1.paraYatir(-100);
} catch (err) {
  console.error(hataMesajiUret(err));
}
```

12 satirlik tekrar, 6 satira indi. Artik yeni bir hata tipi eklemek istesem, sadece
`hataMesajiUret` fonksiyonuna bir `if` eklerim, iki yerde degil.

## Davranis Degismedi mi? Testlerle Dogruladim

Once `hataMesajiUret`'i, `gun-06/main.ts`'in disinda, `haftasonu-4/hata-yardimcisi.ts`
adinda bagimsiz bir dosyada yazip test ettim:

```typescript
it("YetersizBakiyeHatasi icin 'Bakiye yetersiz:' onekini kullanmali", () => {
  const hata = new YetersizBakiyeHatasi("Mevcut bakiye: 750");
  expect(hataMesajiUret(hata)).toBe("Bakiye yetersiz: Mevcut bakiye: 750");
});
```

```
✓ hata-yardimcisi.test.ts (3 tests)
  ✓ YetersizBakiyeHatasi icin 'Bakiye yetersiz:' onekini kullanmali
  ✓ GecersizTutarHatasi icin 'Gecersiz tutar:' onekini kullanmali
  ✓ bilinmeyen bir hata icin 'Beklenmeyen hata:' onekini kullanmali
```

Uc test de gecti - fonksiyonun urettigi mesajlarin, eski if/else zincirinin urettigi
mesajlarla birebir ayni oldugunu kanitladi. Sonra ayni fonksiyonu `gun-06/main.ts`'e
tasiyip programi calistirdim; ciktida bakiyeler ve hata mesajlari ("Bakiye yetersiz:
Yetersiz bakiye. Mevcut bakiye: 4000" gibi) refactor oncesiyle birebir ayni cikti.

## Testler Neden Guven Verdi?

Refactoring'in tanimi tam olarak bu: **davranisi degistirmeden** kodun ic yapisini
iyilestirmek. Yani refactor "basarili" sayilmasi icin, oncesi ve sonrasi disaridan
bakildiginda ayni sonucu vermeli.

Testler olmasaydi, "davranis gercekten degismedi mi" sorusunu sadece programi calistirip
ciktiyi gozle okuyarak cevaplayabilirdim - ki bunu da yaptim (yukaridaki main.ts
calistirmasi), ama gozle kontrol her zaman guvenilir degil, ozellikle cikti uzunsa
kucuk bir farki kacirabilirim. `hataMesajiUret` icin yazdigim 3 test, degisiklik
oncesinde de yazilmis olsaydi, degisiklik sonrasi calistirdigimda ayni testler
gecerse "davranis ayni kaldi" iddiasini otomatik ve kesin sekilde dogrulardi.

Bu odevde testleri fonksiyonu cikardiktan SONRA yazdim, ama gercek bir projede dogru
sira su olurdu: once eski davranisi test altina al, sonra refactor et, testler hala
gecsin. Bu sira, refactor sirasinda "bir seyi bozdum mu" sorusunu her degisiklikten
sonra saniyeler icinde cevaplamami saglardi.

## Test Piramidi

Test piramidi, bir projede kac tane hangi turden test olmasi gerektigini anlatan bir
fikir. Piramidin:

- **Alt kati (en genis, en cok sayida)**: birim testleri (unit test). Tek bir fonksiyonu,
  hicbir dis bagimliliga (ag, veritabani, dosya sistemi) dokunmadan test eder. Hizli
  calisir, cok sayida yazilabilir. Bu odevde yazdigim `hataMesajiUret` testleri tam
  bu katmana giriyor - Gun 17 ve Gun 19'da yazdigim testlerin cogu da boyle.

- **Orta kat**: entegrasyon testleri (integration test). Birkac parcanin birlikte
  dogru calistigini test eder - ornegin Gun 19'da yazdigim, bellekte gecici bir
  veritabaniyla upsert davranisini test eden testler bu katmana daha yakin, cunku
  gercek bir veritabani motoruyla (SQLite) etkilesiyor, sadece tek bir saf fonksiyon
  degil.

- **Ust kat (en dar, en az sayida)**: uctan uca testler (end-to-end / e2e test).
  Uygulamayi bastan sona, gercek bir kullanicinin yapacagi gibi calistirip test eder
  - ornegin CLI'imi gercekten `sync octokit` diye calistirip veritabaninda dogru
  veri olustugunu kontrol etmek gibi. Bu testler en gercekci ama en yavas ve en
  kirilgan (aga, disaridaki bir servise bagimli oldugu icin).

Piramit sekli bilerek boyle: tabanda cok, tepede az test olmasi oneriliyor. Sebebi,
birim testlerin hem hizli hem ucuz olmasi - yuzlercesini saniyeler icinde calistirabilirim.
Uctan uca testler ise yavas, kirilgan ve bakimlari zor; bu yuzden sadece en kritik
senaryolar icin birkac tane yazilir. Eger tersine bir piramit (tepe genis, taban dar)
olsaydi, test paketinin tamami calismasi dakikalar surer ve surekli, ilgisiz sebeplerle
(ag gecikmesi gibi) kirilirdi.

Bu odevdeki refactor da tam bu fikri destekliyor: `hataMesajiUret`'i ayri, saf bir
fonksiyona cikararak, onu piramidin en alt (en ucuz, en hizli) katinda test edilebilir
hale getirdim. Eger bu mantik hala `main()`'in icine gomulu kalsaydi, onu test etmenin
tek yolu butun programi calistirip cikagi okumak olurdu - bu da onu piramidin tepesine,
yani en pahali katmana iterdi.

## Ogrendigim Kavramlar

- **Code smell**: kodun calisir olmasina ragmen, gelecekte sorun cikarma ihtimali
  yuksek olan yapisal isaretler (tekrar eden kod, uzun fonksiyon, anlamsiz isim vb.)
- **Refactoring**: davranisi degistirmeden kodun ic yapisini iyilestirmek
- **Extract Method**: tekrar eden veya karmasik bir kod blogunu, adiyla ne yaptigini
  anlatan ayri bir fonksiyona tasima
- **Test piramidi**: birim testlerin tabanda cok, uctan uca testlerin tepede az
  olmasi gerektigini soyleyen fikir - hiz/guvenilirlik ile gercekcilik arasindaki
  denge
- **Testlerin refactor'daki rolu**: "davranis degismedi" iddiasini gozle kontrolden
  otomatik, tekrarlanabilir bir dogrulamaya cevirmeleri