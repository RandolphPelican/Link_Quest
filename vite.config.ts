import { defineConfig } from "vite";

export default defineConfig({
  root: "src/client",
  base: "./",
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
