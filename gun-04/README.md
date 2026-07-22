# Banka Hesabi Modeli

Staj Gun 4 odevi. Sinif, constructor ve encapsulation calisildi.

## Neler Var

- **BankaHesabi sinifi**: hesap no, sahibi ve bakiyeyi bir arada tutuyor
- **bakiye private**: disaridan degistirilemiyor, sadece metodlar uzerinden erisiliyor
- **hesapNo / sahibi readonly**: disaridan okunabiliyor ama degistirilemiyor
- **paraYatir(tutar): void**: negatif tutar gelirse hata firlatiyor
- **paraCek(tutar): void**: negatif tutar veya yetersiz bakiye durumunda hata firlatiyor
- **get bakiye()**: bakiyeyi okumak icin getter
- **ekstre(): void**: islem gecmisini console.table ile tablo halinde basiyor
- **islemGecmisi**: her islemde tarih, tur ve tutar kaydediliyor

## Calistirma

Proje kokunden calistirilir:

```bash
npm install
npm run start gun-04/main.ts
```

## Bakiyeyi neden private yaptim?

Bakiye sadece belli kurallara gore degismeli: para yatirilinca artmali, cekilince azalmali, negatif olmamali
ve her degisiklik islem gecmisine kaydedilmeli. Private yapinca bakiyeyi degistirmenin tek yolu paraYatir ve
paraCek metodlari oluyor, kontroller de o metodlarin icinde.

## Disaridan erisilebilseydi ne olurdu?

- Biri `hesap.bakiye = 999999` yazip hic para yatirmadan bakiyesini artirabilirdi
- Bakiye degisirdi ama islem gecmisine kayit dusmezdi, ekstre ile gercek bakiye tutmazdi
- Bakiye yanlis oldugunda kimin degistirdigini bulmak zor olurdu, kodun her yerinden degistirilebilirdi
- Yarin "gunluk cekim limiti" gibi yeni bir kural eklemek istesem, herkes bakiyeye direkt eristigi icin bu
  kurali zorlamanin yolu olmazdi

## bakiyeGoster() yerine getter

Once `bakiyeGoster()` diye normal bir metot yazmistim, getter'a cevirdim:

```typescript
private _bakiye: number;

get bakiye(): number {
  return this._bakiye;
}
```

Artik `hesap.bakiyeGoster()` degil `hesap.bakiye` yaziliyor. Disaridan bakinca normal bir alan gibi duruyor
ama arkada hala private alani okuyorum. `hesap.bakiye = 999999` denenirse derleme hatasi veriyor, cunku
setter yazmadim.

## readonly

`hesapNo` ve `sahibi` public'ti, disaridan `hesap.hesapNo = "TR999"` yazilabiliyordu. Hesap numarasi
olusturulduktan sonra degismemeli, o yuzden `readonly` yaptim. Private yapmadim cunku bu bilgiler zaten
disariya acik olmali, sadece degistirilememeli.

## Donus tipleri

Metodlarda donus tipi yazmamistim, TypeScript zaten cikariyordu. Ama acik yazinca metodun ne dondurdugu
imzadan belli oluyor, o yuzden `: void` ve `: number` ekledim.