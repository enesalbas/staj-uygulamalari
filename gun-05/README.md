# Bildirim Sistemi

Staj Gun 5 odevi. Kalitim, polymorphism, interface ve composition calisildi.

## Neler Var

- **Bildirim interface'i**: her bildirimin `gonder(mesaj)` metodu ve `kanalAdi` alani olmasi gerektigini soyleyen sozlesme
- **EmailBildirim, SmsBildirim, SlackBildirim**: uc farkli sinif, her biri Bildirim'i implements ediyor ve gonder'i kendi formatinda yaziyor
- **Polymorphism**: Bildirim[] tipinde bir liste olusturuldu, ucu de eklendi, tek bir forEach ile hepsine ayni mesaj gonderildi. Cagiran kod hangi tur oldugunu bilmiyor
- **TercihliBildirim**: icinde bir Bildirim nesnesi tutan ve gonderme isini ona devreden sinif (composition ornegi)


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