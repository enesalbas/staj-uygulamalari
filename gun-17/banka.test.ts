import { describe, it, expect } from "vitest";
import { bakiyeGuncelle, YetersizBakiyeHatasi, GecersizTutarHatasi } from "./banka.js";

describe("bakiyeGuncelle", () => {
  it("normal yatirma bakiyeyi arttirmali", () => {
    const sonuc = bakiyeGuncelle(1000, 500, "yatirma");
    expect(sonuc).toBe(1500);
  });

  it("normal cekme bakiyeyi azaltmali", () => {
    const sonuc = bakiyeGuncelle(1000, 300, "cekme");
    expect(sonuc).toBe(700);
  });

  // Kenar durum 1: negatif tutar
  it("negatif tutar hata firlatmali", () => {
    expect(() => bakiyeGuncelle(1000, -50, "yatirma")).toThrow(GecersizTutarHatasi);
  });

  // Kenar durum 2: yetersiz bakiye
  it("bakiyeden fazla cekmeye calisinca hata firlatmali", () => {
    expect(() => bakiyeGuncelle(100, 500, "cekme")).toThrow(YetersizBakiyeHatasi);
  });

  // Kenar durum 3: sifir tutar
  it("sifir tutar hata firlatmali", () => {
    expect(() => bakiyeGuncelle(1000, 0, "yatirma")).toThrow(GecersizTutarHatasi);
  });
});