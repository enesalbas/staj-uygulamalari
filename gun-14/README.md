# Gercek Bir API ile Calis

Staj Gun 14 odevi. GitHub API'siyle kimlik dogrulama, sayfalama ve hata yonetimi calistim.

## Neler Var

- **main.ts**: microsoft organizasyonunun tum repolarini sayfa sayfa ceken program
- **.env.example**: hangi ortam degiskeninin gerektigini gosteren sablon
- **.env**: gercek token (git'e girmiyor)
- **repolar.json**: cekilen veri (git'e girmiyor, program calisinca yeniden uretilir)

## Kurulum

1. GitHub'da **Settings > Developer settings > Personal access tokens > Tokens (classic)**
   uzerinden bir token olustur. Public repo okumak icin hicbir kutuyu isaretlemene gerek yok.
2. `.env.example`'i kopyalayip `.env` yap:
   ```bash
   cp .env.example .env
   ```
3. `.env` icindeki `GITHUB_TOKEN` degerini kendi token'inla degistir.

**Token asla commit edilmemeli.** `.gitignore`'da `.env` zaten haric tutuluyor.

## Calistirma

```bash
node --env-file=.env --loader ts-node/esm main.ts
```

Node 20.6+ ortam degiskenlerini `--env-file` ile yerlesik okuyabiliyor, ekstra paket gerekmiyor.

## Sayfalama

GitHub bir istekte en fazla 100 kayit veriyor. microsoft organizasyonunun 8000'den fazla
reposu oldugu icin tek istek yetmiyor.

GitHub, cevabin `Link` basliginda bir sonraki sayfanin adresini veriyor:

```
<...&page=2>; rel="next", <...&page=1647>; rel="last"
```

Kendi sayfa numaramı elle artirmak yerine bu basligi okuyup takip ettim. Boylece "ne zaman
duracagimi" GitHub'in kendisi soyluyor; `rel="next"` gelmeyi kesince donguyu durduruyorum.

```typescript
while (url) {
  const cevap = await apiGet(url);
  // ... veriyi isle
  url = sonrakiSayfaUrl(cevap);
}
```

**Sonuc:** 83 sayfa, toplam 8234 repo.

## Hata Yonetimi (apiGet)

Tum istekler `apiGet` fonksiyonundan geciyor. Farkli durum kodlarina farkli tepki veriyor:

| Durum | Tepki |
|---|---|
| 200 | Cevabi dondur |
| 401 | "Token gecersiz veya suresi dolmus" mesajiyla hata firlat |
| 404 | "Organizasyon bulunamadi" mesajiyla hata firlat |
| 429 | 5 saniye bekleyip **bir kez** yeniden dene, yine basarisizsa hata firlat |
| 500 | "GitHub sunucu hatasi" mesajiyla hata firlat |

### 401 ve 404'u bilerek tetikleme

**404** icin var olmayan bir organizasyon adi kullandim:
```
/orgs/bu-org-kesinlikle-yok-12345/repos
```
GitHub 404 dondu, `GitHubApiHatasi` firlatildi ve yakalandi.

**401** icin bilerek bozuk bir token gonderdim:
```typescript
Authorization: `Bearer yanlis-bir-token-12345`
```
GitHub 401 dondu, ayni sekilde yakalandi.

### 429 icin yeniden deneme

```typescript
if (cevap.status === 429) {
  if (yenidenDenendi) {
    throw new GitHubApiHatasi(429, "...");
  }
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return apiGet(url, true);
}
```

`yenidenDenendi` parametresi varsayilan olarak `false`. 429 gelirse 5 saniye bekleyip
fonksiyonu `true` ile tekrar cagiriyorum. Ikinci denemede de 429 gelirse artik yeniden
denemiyorum, hata firlatiyorum. Bu, sonsuz bekleme dongusune girmemeyi garantiliyor.

8234 repo cekerken gercekten 429'a takilmadim (istekleri cok hizli atmadigim ve token
limitinin yuksek oldugu icin), ama kodu bilerek tetikleyip test edemedim. Mantigin dogru
oldugunu, kontrollu bir sekilde 429 dondugunde ne olacagini kod okuyarak dogruladim.

## Neden Ayri Hata Tipleri?

`GitHubApiHatasi extends Error` ile durum kodunu tasiyan ozel bir hata sinifi yazdim
(Gun 6 ve Gun 13'teki desen). Boylece hatayi yakalayan kod, mesaja bakmadan durum
koduna gore karar verebiliyor.

## JSON'a Kaydetme

```typescript
await writeFile("repolar.json", JSON.stringify(tumRepolar, null, 2), "utf-8");
```

Cekilen 8234 repo `repolar.json`'a yazildi. Bu dosya git'e eklenmedi (buyuk ve
tekrar uretilebilir); haftaya veritabanina tasinacak.

## Ogrendigim Kavramlar

- **Ortam degiskenleri**: gizli bilgiyi (token) koddan ayirip `.env`'de tutmak,
  `.env.example` ile hangi degiskenlerin gerektigini belgelemek
- **Authorization: Bearer**: token'i istek basligina ekleme
- **Link basligi ile sayfalama**: sunucunun "sonraki sayfa" adresini vermesi,
  kendi sayfa sayacimi elle yonetmek zorunda kalmama
- **Katmanli hata yonetimi**: her durum koduna ozel mesaj, 429 icin bekleyip
  yeniden deneme, sonsuz donguyu onleyen bayrak
- **Gercek API'nin JSONPlaceholder'dan farki**: kimlik dogrulama zorunlu,
  veri tek seferde gelmiyor, hiz siniri var