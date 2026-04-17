/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname),
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
  },
});
