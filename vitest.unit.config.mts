import { defineProject, mergeConfig } from "vitest/config";

import sharedConfig from "./vitest.shared.mts";

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      name: "unit",
      environment: "node",
      include: ["src/**/*.test.ts"],
      exclude: ["src/lib/tracker/ai.test.ts", "src/**/*.integration.test.ts"],
    },
  }),
);
