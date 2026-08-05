import { describe, it, expect } from "vitest";
import { GitHubRepoSemasi } from "./dogrulama.js";

const gecerliRepo = {
  id: 1,
  name: "ornek-repo",
  language: "TypeScript",
  stargazers_count: 42,
  html_url: "https://github.com/ornek/ornek-repo",
};

describe("GitHubRepoSemasi", () => {
  it("gecerli veri basariyla dogrulanmali", () => {
    const sonuc = GitHubRepoSemasi.safeParse(gecerliRepo);
    expect(sonuc.success).toBe(true);
  });

  it("stargazers_count metin ise gecersiz olmali", () => {
    const bozuk = { ...gecerliRepo, stargazers_count: "cok" };
    const sonuc = GitHubRepoSemasi.safeParse(bozuk);
    expect(sonuc.success).toBe(false);
  });

  it("html_url eksikse gecersiz olmali", () => {
    const { html_url, ...bozuk } = gecerliRepo;
    const sonuc = GitHubRepoSemasi.safeParse(bozuk);
    expect(sonuc.success).toBe(false);
  });

  it("language null olabilmeli (gecerli)", () => {
    const sonuc = GitHubRepoSemasi.safeParse({ ...gecerliRepo, language: null });
    expect(sonuc.success).toBe(true);
  });
});