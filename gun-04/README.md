# Banka Hesabi Modeli

Staj Gun 4 odevi. Sinif, constructor ve encapsulation calisildi.

## Neler Var

- **BankaHesabi sinifi**: hesap no, sahibi ve bakiyeyi bir arada tutuyor
- **bakiye private**: disaridan degistirilemiyor, sadece metodlar uzerinden erisiliyor
- **paraYatir(tutar)**: negatif tutar gelirse hata firlatiyor
- **paraCek(tutar)**: negatif tutar veya yetersiz bakiye durumunda hata firlatiyor
- **bakiyeGoster()**: bakiyeyi okumak icin
- **ekstre()**: islem gecmisini console.table ile tablo halinde basiyor
- **islemGecmisi**: her islemde tarih, tur ve tutar kaydediliyor

## Calistirma

```bash
npm install
npx ts-node gun-04/main.ts
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