import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@openbooking/core": fileURLToPath(
        new URL("../booking-core/src/index.ts", import.meta.url)
      )
    }
  },
  test: {
    environment: "jsdom"
  }
});
