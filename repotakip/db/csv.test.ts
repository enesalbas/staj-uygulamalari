import { describe, it, expect } from "vitest";
import { csvUret } from "./csv.js";

describe("csvUret", () => {
  it("basit repolari dogru CSV satirlarina cevirmeli", () => {
    const csv = csvUret([
      { id: 1, name: "repo-a", language: "TypeScript", stars: 100, url: "https://x.com/a", fetchedAt: "t1" },
    ]);
    expect(csv).toBe(
      "id,name,language,stars,url,fetchedAt\n1,repo-a,TypeScript,100,https://x.com/a,t1\n"
    );
  });

  it("virgul iceren alani tirnak icine almali", () => {
    const csv = csvUret([
      { id: 1, name: "repo,with,comma", language: "TS", stars: 5, url: "x", fetchedAt: "t" },
    ]);
    expect(csv).toContain('"repo,with,comma"');
  });

  it("tirnak iceren alani ikiye katlayip tirnaklamali", () => {
    const csv = csvUret([
      { id: 1, name: 'repo "quoted"', language: "TS", stars: 5, url: "x", fetchedAt: "t" },
    ]);
    expect(csv).toContain('"repo ""quoted"""');
  });

  it("language null ise bos hucre birakmali", () => {
    const csv = csvUret([
      { id: 1, name: "a", language: null, stars: 5, url: "x", fetchedAt: "t" },
    ]);
    expect(csv).toContain("1,a,,5,x,t");
  });

  it("bos dizi verilince sadece baslik satirini dondurmeli", () => {
    const csv = csvUret([]);
    expect(csv).toBe("id,name,language,stars,url,fetchedAt\n");
  });
});