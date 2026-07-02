import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": path.resolve(rootDirectory, "src") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "functions/**/*.ts",
        "src/domain/**/*.ts",
        "src/lib/**/*.ts",
        "src/server/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "src/domain/assessment/index.ts",
        "src/server/cloudflare.ts",
      ],
      thresholds: { lines: 75, functions: 75, statements: 75, branches: 65 },
    },
  },
});
