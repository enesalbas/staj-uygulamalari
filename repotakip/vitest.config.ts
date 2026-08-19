import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      GITHUB_TOKEN: "test-token-for-vitest",
      NODE_ENV: "development",
    },
  },
});
