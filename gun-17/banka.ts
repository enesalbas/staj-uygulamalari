export class YetersizBakiyeHatasi extends Error {}
export class GecersizTutarHatasi extends Error {}

export function bakiyeGuncelle(mevcutBakiye: number, tutar: number, islem: "yatirma" | "cekme"): number {
  if (tutar <= 0) {
    throw new GecersizTutarHatasi("Tutar pozitif olmali");
  }
  if (islem === "cekme" && tutar > mevcutBakiye) {
    throw new YetersizBakiyeHatasi("Yetersiz bakiye");
  }
  return islem === "yatirma" ? mevcutBakiye + tutar : mevcutBakiye - tutar;
}