import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineProject, mergeConfig } from "vitest/config";

import sharedConfig from "./vitest.shared.mts";

export default mergeConfig(
  sharedConfig,
  defineProject({
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
  }),
);
