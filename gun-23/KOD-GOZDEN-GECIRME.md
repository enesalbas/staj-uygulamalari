# Kod Gozden Gecirme

Gozden gecirilen dosya: `gun-06/main.ts` (Kalici Banka odevi)

Bu, kendi yazdigim eski bir kod. Bugunku linter/formatter bilgimle tekrar okuyunca
uc noktada yapici elestiri yapabilecegimi fark ettim.

## 1. `veri.map((veri: any) => ...)` tipinde `any` kullanimi

**Ne:** `fromJSON` fonksiyonunda parametre tipi `any`:
\`\`\`typescript
static fromJSON(veri: any): BankaHesabi {
\`\`\`

**Neden sorun:** `any`, TypeScript'in tip kontrolunu tamamen kapatiyor. `veri.hesapNo`
yerine yanlislikla `veri.hesapNoo` yazsam, derleyici hic uyarmaz - hata ancak calisma
zamaninda ortaya cikar. Bugun ESLint kurunca `no-explicit-any` kuralinin tam bunun icin
var oldugunu gordum.

**Oneri:** `unknown` kullanip, Gun 16'da ogrendigim gibi Zod ile dogrulamak, ya da en
azindan `Record<string, unknown>` gibi daha dar bir tip vermek. `any` yerine `unknown`
kullansaydim, derleyici beni "once bu tipi daraltmadan alanlarina erisemezsin" diye
uyarirdi.

## 2. Iki catch blogunda tekrar eden kod (Hafta Sonu 4'te kismen duzeltildi)

**Ne:** Hatali senaryolar bolumunde iki ayri `try/catch`, ayni `instanceof` zincirini
tekrarliyordu. Bunu Hafta Sonu 4'te `hataMesajiUret` fonksiyonuna cikararak duzelttim.

**Neden sorun (hatirlatma olarak):** Ayni mantigin iki yerde olmasi, birini degistirip
digerini unutma riskini artiriyordu.

**Oneri (zaten uygulandi):** `hataMesajiUret(err)` yardimci fonksiyonu ile tek yerde
topladim, testlerle davranisin degismedigini dogruladim. Bu maddeyi, "bir kod kokusunu
fark edip duzeltmenin" somut bir ornegi olarak buraya da not dusuyorum.

## 3. Degisken adlandirmasi: `veri` cok genel

**Ne:** `fromJSON(veri: any)` parametresinin adi `veri` - hem `main.ts` icinde hem
baska dosyalarda cok genel bir isim, ne oldugu (bir hesabin JSON hali oldugu) isimden
anlasilmiyor.

**Neden sorun:** Fonksiyonu tek basina okuyan biri (ornegin ben, alti ay sonra), `veri`
adindan bunun bir "hesap kaydi" oldugunu anlayamaz. Daha spesifik bir isim, kodu
belgeleme ihtiyacini azaltir.

**Oneri:** `veri` yerine `hesapVerisi` ya da Gun 11 ORM gunlerinde ogrendigim gibi
`HesapKaydi` adinda bir arayuz (interface) tanimlayip parametreyi ona gore tipleyip
isimlendirmek: `fromJSON(hesapVerisi: HesapKaydi): BankaHesabi`.

## Genel Degerlendirme

Bu dosyayi ilk yazdigimda (Gun 6), henuz `any`'nin riskini ya da isimlendirmenin
onemini tam kavramamistim. Bugun ayni dosyaya linter gozuyle bakinca, o zamanki
bilgimle simdiki bilgim arasindaki farki somut olarak gorebildim. Bu da kod gozden
gecirmenin (code review) neden degerli oldugunu gosteriyor: baskasi (ya da gecmis
halim) fark etmedigi seyleri, taze bir gozle bakan biri fark edebiliyor.
