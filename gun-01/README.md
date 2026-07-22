# TypeScript Alıştırması — Tip Sistemi ve Filtreleme

Staj Gün 1 ödevi. TypeScript'in tip sistemi, generic fonksiyonlar ve async/await konularını kapsayan küçük bir proje.

## Neler Var

- **User interface**: bir kullanıcının sahip olması gereken alanları tanımlar (`id`, `name`, `email`, `role`)
- **Role union type**: `role` alanının sadece `"admin"`, `"developer"` veya `"intern"` olabileceğini garanti eder
- **filterByRole**: generic bir fonksiyon, `User[]` dizisini role'e göre filtreler
- **main()**: `users.json` dosyasını async okur, filtreler, sonucu konsola yazar
- **try/catch**: dosya bulunamazsa veya JSON bozuksa program çökmez, anlamlı bir hata mesajı basar

## Kurulum ve Çalıştırma

Proje kökünden:

```bash
npm install
npm run start gun-01/main.ts
```

ESM'e geçtikten sonra `npx ts-node` çalışmıyor, o yüzden `npm run start` kullanıyorum.

## Dosya yolu

Önce `readFile("gun-01/users.json")` yazmıştım ama bu yol, programı çalıştırdığım dizine göre çözülüyor.
Kökten çalıştırınca oluyor, klasörün içinden çalıştırınca dosyayı bulamıyor. Şimdi şöyle:

```typescript
const DOSYA_YOLU = new URL("users.json", import.meta.url);
```

`import.meta.url` bu dosyanın kendi konumu, yol ona göre çözülüyor. Artık nereden çalıştırdığım fark etmiyor.

## Hata Testi

`gun-01/users.json` dosyasının adını değiştirip tekrar çalıştır — program çökmeden hata mesajı basacaktır.