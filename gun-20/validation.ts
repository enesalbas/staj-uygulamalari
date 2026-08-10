import { z } from "zod";

export const GitHubRepoSemasi = z.object({
  id: z.number(),
  name: z.string().min(1),
  language: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  html_url: z.url(),
});

export function repoyaDonustur(repo: z.infer<typeof GitHubRepoSemasi>) {
  return {
    id: repo.id,
    name: repo.name,
    language: repo.language,
    stars: repo.stargazers_count,
    url: repo.html_url,
    fetchedAt: new Date().toISOString(),
  };
}