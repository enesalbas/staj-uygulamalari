# Bildirim Sistemi

Staj Gun 5 odevi. Kalitim, polymorphism, interface ve composition calisildi.

## Neler Var

- **Bildirim interface'i**: her bildirimin `gonder(mesaj)` metodu ve `kanalAdi` alani olmasi gerektigini soyleyen sozlesme
- **EmailBildirim, SmsBildirim, SlackBildirim**: uc farkli sinif, her biri Bildirim'i implements ediyor ve gonder'i kendi formatinda yaziyor
- **Polymorphism**: Bildirim[] tipinde bir liste olusturuldu, ucu de eklendi, tek bir forEach ile hepsine ayni mesaj gonderildi. Cagiran kod hangi tur oldugunu bilmiyor
- **TercihliBildirim**: kullanicinin tercihini (`"email" | "sms" | "slack"`) alip **dogru kanali kendisi secen** ve gonderme isini ona devreden sinif (composition ornegi)

## Calistirma

Proje kokunden calistirilir:

```bash
npm install
npm run start gun-05/main.ts
```


## Ogrendigim Kavramlar

- **interface**: bir sinifin uymasi gereken sozlesme. Sadece "ne olmali" der, "nasil olacagini" degil
- **implements**: bir sinifin bir interface'e uydugunu belirtir. O interface'in tum uyelerini saglamak zorunda kalir
- **polymorphism**: farkli siniflari, ortak interface'leri uzerinden ayni sekilde kullanabilmek. "Neye" degil "ne yapabildigine" gore programlama
- **composition**: bir sinifin baska nesneleri icinde barindirip isi onlara devretmesi. "Bir seydir" degil "bir seye sahiptir" iliskisi

## Yeni bir kanal (or. push notification) eklemek istesem hangi dosyalara dokunurum?

Sadece tek bir sey eklerim: Bildirim interface'ini implements eden yeni bir sinif. Ornegin:

```typescript
class PushBildirim implements Bildirim {
  kanalAdi: string = "Push";
  gonder(mesaj: string): void {
    console.log(`🔔 Push -> ${mesaj}`);
  }
}
```

Mevcut siniflara (EmailBildirim, SmsBildirim, SlackBildirim) veya polymorphism'i kullanan donguye hic dokunmam gerekmiyor.

## Neden bu kadar az?

Cunku Bildirim bir sozlesme. PushBildirim de bu sozlesmeye uydugu icin (gonder metodu ve kanalAdi alani), sistem onu digerleri gibi kabul ediyor. Bildirim[] listesine ekleyebilirim, forEach dongusu onu da otomatik gonderir cunku dongu "bu hangi tur?" diye bakmiyor, sadece "bu bir Bildirim mi? oyleyse gonder" diyor.

Yani cagiran kod, somut siniflara degil interface'e bagli. Yeni bir tur eklendiginde calisan kodu degistirmeme gerek kalmiyor. Bu yaklasim, yeni ozellik eklerken mevcut calisan kodu bozma riskini ortadan kaldiriyor.

## TercihliBildirim'de tercihi kanala cevirmek

Ilk yazdigimda constructor hazir bir `Bildirim` nesnesi aliyordu:

```typescript
new TercihliBildirim(new EmailBildirim());
```

Burada secimi yapan aslinda cagiran taraf, sinif sadece kendisine verilen nesneyi kullaniyor. Odevde ise
kullanicinin tercihine gore kanali secen bir sinif isteniyordu. Duzeltince tercihi string olarak aliyor:

```typescript
type KanalTercihi = "email" | "sms" | "slack";

constructor(tercih: KanalTercihi) {
  const kanallar: Record<KanalTercihi, Bildirim> = {
    email: new EmailBildirim(),
    sms: new SmsBildirim(),
    slack: new SlackBildirim()
  };
  this.kanal = kanallar[tercih];
}
```

Kullanimi `new TercihliBildirim("email")` oldu. Kullanicinin tercihi zaten veritabaninda string olarak
duracagi icin bu daha mantikli geldi.

`if/else` yerine obje kullandim cunku `Record<KanalTercihi, Bildirim>` yazinca TypeScript her tercih icin
karsilik olmasini zorunlu tutuyor. Tipe `"push"` eklersem ve tabloya yazmayi unutursam kod derlenmiyor.
`if/else` olsaydi unuttugum dal `undefined` doner ve hatayi ancak calistirinca gorurdum.

## kanalAdi

`TercihliBildirim`'de `kanalAdi`'ni constructor'da kopyaliyordum. Sarilan kanal degisirse kopya eski kalir,
o yuzden getter yaptim:

```typescript
get kanalAdi(): string {
  return this.kanal.kanalAdi;
}
```

Diger siniflardaki `kanalAdi` alanlarini da `readonly` yaptim, bir kanalin adi disaridan degismemeli.