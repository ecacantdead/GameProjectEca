import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0", // Allows access from outside
    port: 3000,
    open: false, // Changed from true to false to prevent browser opening
    allowedHosts: [
      "guntingbatukertas.cdcdisdiksulsel.info",
      ".cdcdisdiksulsel.info", // Allows all subdomains
      "localhost",
    ],
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    // Also add allowedHosts to preview config
    allowedHosts: [
      "guntingbatukertas.cdcdisdiksulsel.info",
      ".cdcdisdiksulsel.info",
      "localhost",
    ],
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          vendor: ["gsap"],
        },
      },
    },
  },
  base: "./",
});
