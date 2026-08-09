import { describe, it, expect } from "vitest";
import { hataMesajiUret, YetersizBakiyeHatasi, GecersizTutarHatasi } from "./hata-yardimcisi.js";

describe("hataMesajiUret", () => {
  it("YetersizBakiyeHatasi icin 'Bakiye yetersiz:' onekini kullanmali", () => {
    const hata = new YetersizBakiyeHatasi("Mevcut bakiye: 750");
    expect(hataMesajiUret(hata)).toBe("Bakiye yetersiz: Mevcut bakiye: 750");
  });

  it("GecersizTutarHatasi icin 'Gecersiz tutar:' onekini kullanmali", () => {
    const hata = new GecersizTutarHatasi("Tutar pozitif olmali");
    expect(hataMesajiUret(hata)).toBe("Gecersiz tutar: Tutar pozitif olmali");
  });

  it("bilinmeyen bir hata icin 'Beklenmeyen hata:' onekini kullanmali", () => {
    const hata = new Error("baska bir sorun");
    expect(hataMesajiUret(hata)).toBe("Beklenmeyen hata: baska bir sorun");
  });
});