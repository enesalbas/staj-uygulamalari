// Repo dizisini CSV metnine cevirir. Virgul veya tirnak iceren alanlar
// (ozellikle name'de nadiren olabilir) cift tirnakla sarilip ic tirnaklar
// ikiye katlanir - standart CSV kacis kurali.
function csvHucre(deger: string | number | null): string {
  if (deger === null) return "";
  const metin = String(deger);
  if (metin.includes(",") || metin.includes('"') || metin.includes("\n")) {
    return `"${metin.replace(/"/g, '""')}"`;
  }
  return metin;
}

export interface ExportRepo {
  id: number;
  name: string;
  language: string | null;
  stars: number;
  url: string;
  fetchedAt: string;
}

export function csvUret(repolar: ExportRepo[]): string {
  const baslik = "id,name,language,stars,url,fetchedAt";
  const satirlar = repolar.map((r) =>
    [
      csvHucre(r.id),
      csvHucre(r.name),
      csvHucre(r.language),
      csvHucre(r.stars),
      csvHucre(r.url),
      csvHucre(r.fetchedAt),
    ].join(",")
  );
  return [baslik, ...satirlar].join("\n") + "\n";
}
