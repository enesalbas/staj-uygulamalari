import { z } from "zod";

export const GitHubRepoSemasi = z.object({
  id: z.number(),
  name: z.string().min(1),
  language: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  html_url: z.url(),
});

export type GitHubRepo = z.infer<typeof GitHubRepoSemasi>;

export interface DogrulamaSonucu {
  gecerliler: GitHubRepo[];
  hatalar: { index: number; sebep: string }[];
}

// Ham (dogrulanmamis) repo dizisini semaya gore suzer.
// Gecersiz olanlari programi durdurmadan raporlar.
export function repolariDogrula(hamRepolar: unknown[]): DogrulamaSonucu {
  const gecerliler: GitHubRepo[] = [];
  const hatalar: { index: number; sebep: string }[] = [];

  hamRepolar.forEach((repo, index) => {
    const sonuc = GitHubRepoSemasi.safeParse(repo);
    if (sonuc.success) {
      gecerliler.push(sonuc.data);
    } else {
      const sebep = sonuc.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      hatalar.push({ index, sebep });
    }
  });

  return { gecerliler, hatalar };
}

// Dogrulanmis GitHub verisini, veritabani semamizin bekledigi sekle cevirir.
export function repoyaDonustur(repo: GitHubRepo) {
  return {
    id: repo.id,
    name: repo.name,
    language: repo.language,
    stars: repo.stargazers_count,
    url: repo.html_url,
    fetchedAt: new Date().toISOString(),
  };
}
