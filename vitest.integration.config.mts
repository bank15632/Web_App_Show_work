import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";

export default defineProject({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    cloudflareTest({
      main: "./src/test/empty-worker.ts",
      wrangler: {
        configPath: "./wrangler.test.jsonc",
      },
    }),
  ],
  test: {
    name: "integration",
    include: ["src/lib/tracker/ai.test.ts", "src/**/*.integration.test.ts"],
  },
});
