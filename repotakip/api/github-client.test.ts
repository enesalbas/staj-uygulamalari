import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiGet, sonrakiSayfaUrl, GitHubApiHatasi } from "./github-client.js";

describe("apiGet - retry mantigi (sahte fetch ile)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("ilk cagrida 429, ikincide 200 donerse sonucu dondurmeli ve fetch 2 kez cagrilmali", async () => {
    const fakeFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(new Response("tamam", { status: 200 }));
    vi.stubGlobal("fetch", fakeFetch);

    const sonucPromise = apiGet("https://api.github.com/test");
    await vi.runAllTimersAsync();
    const sonuc = await sonucPromise;

    expect(sonuc.status).toBe(200);
    expect(fakeFetch).toHaveBeenCalledTimes(2);
  });

  it("hep 500 donerse MAX_DENEME sonunda hata firlatmali ve fetch tam 3 kez cagrilmali", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fakeFetch);

    const sonucPromise = apiGet("https://api.github.com/test").catch((e) => e);
    await vi.runAllTimersAsync();
    const sonuc = await sonucPromise;

    expect(sonuc).toBeInstanceOf(GitHubApiHatasi);
    expect(fakeFetch).toHaveBeenCalledTimes(3);
  });

  it("404 donerse hic yeniden denememeli, fetch sadece 1 kez cagrilmali", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fakeFetch);

    await expect(apiGet("https://api.github.com/test")).rejects.toBeInstanceOf(GitHubApiHatasi);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });
});

describe("sonrakiSayfaUrl", () => {
  it("rel=next iceren Link basligindan sonraki sayfa URLini cikarmali", () => {
    const cevap = new Response(null, {
      headers: {
        link: '<https://api.github.com/orgs/x/repos?page=2>; rel="next", <https://api.github.com/orgs/x/repos?page=5>; rel="last"',
      },
    });
    expect(sonrakiSayfaUrl(cevap)).toBe("https://api.github.com/orgs/x/repos?page=2");
  });

  it("Link basligi yoksa ya da next icermiyorsa null donmeli", () => {
    const bassiz = new Response(null);
    expect(sonrakiSayfaUrl(bassiz)).toBeNull();

    const sonSayfa = new Response(null, {
      headers: { link: '<https://api.github.com/orgs/x/repos?page=5>; rel="last"' },
    });
    expect(sonrakiSayfaUrl(sonSayfa)).toBeNull();
  });
});