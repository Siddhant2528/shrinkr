import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Use node environment since we're testing utility functions, not DOM
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.{js,ts}"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.{js,ts}"],
      exclude: ["node_modules", ".next"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
