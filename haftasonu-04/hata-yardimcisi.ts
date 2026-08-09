export class YetersizBakiyeHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "Yetersiz Bakiye Hatasi";
  }
}

export class GecersizTutarHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "Gecersiz Tutar Hatasi";
  }
}

/**
 * Bir hatayi tipine gore kategorize edip kullaniciya gosterilecek
 * etiketli mesaji uretir. Gun 6'daki main.ts'te iki ayri catch
 * blogunda tekrar eden instanceof zincirinin cikarilmis hali.
 */
export function hataMesajiUret(err: unknown): string {
  if (err instanceof YetersizBakiyeHatasi) {
    return `Bakiye yetersiz: ${err.message}`;
  }
  if (err instanceof GecersizTutarHatasi) {
    return `Gecersiz tutar: ${err.message}`;
  }
  return `Beklenmeyen hata: ${(err as Error).message}`;
}