import { describe, it, expect } from "vitest";
import { kategoriyeGoreCiro, enPahaliUrun, type Satis } from "./satislar.js";

const ornekSatislar: Satis[] = [
  { urun: "Laptop", kategori: "Elektronik", tutar: 15000 },
  { urun: "Telefon", kategori: "Elektronik", tutar: 8000 },
  { urun: "Masa", kategori: "Mobilya", tutar: 2000 },
];

describe("kategoriyeGoreCiro", () => {
  it("normal durumda kategorilere gore dogru toplami vermeli", () => {
    const sonuc = kategoriyeGoreCiro(ornekSatislar);
    expect(sonuc).toEqual({ Elektronik: 23000, Mobilya: 2000 });
  });

  // Kenar durum: bos liste
  it("bos liste verilince bos obje donmeli", () => {
    const sonuc = kategoriyeGoreCiro([]);
    expect(sonuc).toEqual({});
  });
});

describe("enPahaliUrun", () => {
  it("normal durumda en pahali urunu bulmali", () => {
    const sonuc = enPahaliUrun(ornekSatislar);
    expect(sonuc?.urun).toBe("Laptop");
  });

  // Kenar durum: bos liste
  it("bos liste verilince null donmeli", () => {
    const sonuc = enPahaliUrun([]);
    expect(sonuc).toBeNull();
  });

  // Kenar durum: tek elemanli liste
  it("tek urun varsa o urunu donmeli", () => {
    const tek: Satis[] = [{ urun: "Kalem", kategori: "Kirtasiye", tutar: 10 }];
    expect(enPahaliUrun(tek)?.urun).toBe("Kalem");
  });
});