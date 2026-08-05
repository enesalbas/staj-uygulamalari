import { z } from "zod";

export const GitHubRepoSemasi = z.object({
  id: z.number(),
  name: z.string().min(1),
  language: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  html_url: z.url(),
});