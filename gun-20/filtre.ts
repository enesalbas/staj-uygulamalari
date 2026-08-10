import { and, gte, eq, type SQL } from "drizzle-orm";
import { repos } from "./schema.js";

export interface ListSecenekleri {
  language?: string;
  minStars?: number;
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