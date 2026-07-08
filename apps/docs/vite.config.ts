import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@openbooking/core": fileURLToPath(
        new URL("../../packages/booking-core/src/index.ts", import.meta.url)
      ),
      "@openbooking/react": fileURLToPath(
        new URL("../../packages/booking-react/src/index.tsx", import.meta.url)
      )
    }
  }
});
