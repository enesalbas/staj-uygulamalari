import { and, gte, eq, asc, desc, type SQL } from "drizzle-orm";
import { repos } from "./schema.js";

export interface ListSecenekleri {
  language?: string;
  minStars?: number;
  sort?: "stars" | "name";
}

export function kosullariOlustur(secenekler: ListSecenekleri): SQL | undefined {
  const kosullar = [];

  if (secenekler.language) {
    kosullar.push(eq(repos.language, secenekler.language));
  }
  if (secenekler.minStars !== undefined) {
    kosullar.push(gte(repos.stars, secenekler.minStars));
  }

  if (kosullar.length === 0) {
    return undefined;
  }

  return and(...kosullar);
}

// Siralama sutununu belirler. 'stars' icin azalan (en yuksekten dusuke),
// 'name' icin artan (alfabetik) - ikisi de en dogal beklenen sira.
export function siralamaOlustur(sort?: "stars" | "name") {
  if (sort === "name") {
    return asc(repos.name);
  }
  return desc(repos.stars); // varsayilan: yildiza gore azalan
}
