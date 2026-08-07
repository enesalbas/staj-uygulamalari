import { describe, it, expect } from "vitest";
import { GitHubRepoSemasi, repoyaDonustur } from "./validation.js";

// GitHub'in gercekte dondurdugu formata benzer sahte veri
const sahteApiCevabi = {
  id: 12345,
  name: "ornek-repo",
  language: "TypeScript",
  stargazers_count: 250,
  html_url: "https://github.com/ornek/ornek-repo",
  // GitHub'in gonderdigi ama bizim kullanmadigimiz fazladan alanlar
  owner: { login: "ornek" },
  private: false,
};

describe("GitHubRepoSemasi + repoyaDonustur (veri hatti)", () => {
  it("gecerli sahte veriyi dogrulayip dogru sekle donusturmeli", () => {
    const sonuc = GitHubRepoSemasi.safeParse(sahteApiCevabi);
    expect(sonuc.success).toBe(true);

    if (sonuc.success) {
      const donusturulmus = repoyaDonustur(sonuc.data);
      expect(donusturulmus.id).toBe(12345);
      expect(donusturulmus.name).toBe("ornek-repo");
      expect(donusturulmus.stars).toBe(250); // stargazers_count -> stars
      expect(donusturulmus.url).toBe("https://github.com/ornek/ornek-repo"); // html_url -> url
    }
  });

  it("fazladan alanlari (owner, private) yok saymali", () => {
    const sonuc = GitHubRepoSemasi.safeParse(sahteApiCevabi);
    if (sonuc.success) {
      const donusturulmus = repoyaDonustur(sonuc.data);
      expect(donusturulmus).not.toHaveProperty("owner");
      expect(donusturulmus).not.toHaveProperty("private");
    }
  });

  it("language alani null gelen bir repoyu da dogru donusturmeli", () => {
    const dilYok = { ...sahteApiCevabi, language: null };
    const sonuc = GitHubRepoSemasi.safeParse(dilYok);
    expect(sonuc.success).toBe(true);

    if (sonuc.success) {
      const donusturulmus = repoyaDonustur(sonuc.data);
      expect(donusturulmus.language).toBeNull();
    }
  });
});