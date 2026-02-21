import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/Clodopoly/",
  resolve: {
    alias: {
      "@engine": resolve(__dirname, "src/engine"),
      "@locale": resolve(__dirname, "src/locale"),
      "@ui": resolve(__dirname, "src/ui"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
