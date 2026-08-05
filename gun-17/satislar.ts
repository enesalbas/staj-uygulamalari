export interface Satis {
  urun: string;
  kategori: string;
  tutar: number;
}

export function kategoriyeGoreCiro(satislar: Satis[]): Record<string, number> {
  return satislar.reduce((grup: Record<string, number>, s) => {
    grup[s.kategori] = (grup[s.kategori] ?? 0) + s.tutar;
    return grup;
  }, {});
}

export function enPahaliUrun(satislar: Satis[]): Satis | null {
  if (satislar.length === 0) {
    return null;
  }

  return satislar.reduce((enPahali, s) =>
    s.tutar > enPahali.tutar ? s : enPahali
  );
}