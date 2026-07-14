# TypeScript Alıştırması — Tip Sistemi ve Filtreleme

Staj Gün 1 ödevi. TypeScript'in tip sistemi, generic fonksiyonlar ve async/await konularını kapsayan küçük bir proje.

## Neler Var

- **User interface**: bir kullanıcının sahip olması gereken alanları tanımlar (`id`, `name`, `email`, `role`)
- **Role union type**: `role` alanının sadece `"admin"`, `"developer"` veya `"intern"` olabileceğini garanti eder
- **filterByRole**: generic bir fonksiyon, `User[]` dizisini role'e göre filtreler
- **main()**: `data/users.json` dosyasını async okur, filtreler, sonucu konsola yazar
- **try/catch**: dosya bulunamazsa veya JSON bozuksa program çökmez, anlamlı bir hata mesajı basar

## Kurulum ve Çalıştırma

```bash
npm install
npx ts-node gun-01/main.ts
```

## Hata Testi

`gun-01/users.json` dosyasının adını değiştirip tekrar çalıştır — program çökmeden hata mesajı basacaktır.