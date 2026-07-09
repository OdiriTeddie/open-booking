import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@openbooking/core": workspacePath("../../packages/booking-core/src/index.ts"),
      "@openbooking/react": workspacePath("../../packages/booking-react/src/index.tsx")
    }
  }
});

function workspacePath(path: string): string {
  return decodeURIComponent(new URL(path, import.meta.url).pathname).replace(
    /^\/([A-Za-z]:)/,
    "$1"
  );
}
