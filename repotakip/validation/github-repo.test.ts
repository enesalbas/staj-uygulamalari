import { describe, it, expect } from "vitest";
import { GitHubRepoSemasi, repoyaDonustur, repolariDogrula } from "./github-repo.js";

const sahteApiCevabi = {
  id: 12345,
  name: "ornek-repo",
  language: "TypeScript",
  stargazers_count: 250,
  html_url: "https://github.com/ornek/ornek-repo",
  owner: { login: "ornek" },
  private: false,
};

describe("GitHubRepoSemasi + repoyaDonustur", () => {
  it("gecerli sahte veriyi dogrulayip dogru sekle donusturmeli", () => {
    const sonuc = GitHubRepoSemasi.safeParse(sahteApiCevabi);
    expect(sonuc.success).toBe(true);
    if (sonuc.success) {
      const donusturulmus = repoyaDonustur(sonuc.data);
      expect(donusturulmus.stars).toBe(250);
      expect(donusturulmus.url).toBe("https://github.com/ornek/ornek-repo");
    }
  });

  it("fazladan alanlari (owner, private) yok saymali", () => {
    const sonuc = GitHubRepoSemasi.safeParse(sahteApiCevabi);
    if (sonuc.success) {
      const donusturulmus = repoyaDonustur(sonuc.data);
      expect(donusturulmus).not.toHaveProperty("owner");
    }
  });

  it("language alani null gelen bir repoyu da dogru donusturmeli", () => {
    const sonuc = GitHubRepoSemasi.safeParse({ ...sahteApiCevabi, language: null });
    if (sonuc.success) {
      expect(repoyaDonustur(sonuc.data).language).toBeNull();
    }
  });
});

describe("repolariDogrula", () => {
  it("gecerli ve gecersiz kayitlari ayirmali", () => {
    const hamRepolar = [sahteApiCevabi, { ...sahteApiCevabi, id: 2, stargazers_count: "cok" }];
    const { gecerliler, hatalar } = repolariDogrula(hamRepolar);
    expect(gecerliler).toHaveLength(1);
    expect(hatalar).toHaveLength(1);
  });
});
