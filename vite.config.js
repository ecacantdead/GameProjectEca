import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0", // Penting untuk deployment - memungkinkan akses dari luar
    port: 3000, // Sesuaikan dengan port yang dikonfigurasi di Coolify
    open: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Tambahkan konfigurasi untuk source maps
    sourcemap: true,
    // Optimalkan ukuran bundle
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false, // Tetap tampilkan console.log untuk debugging
      },
    },
    // Pastikan path relatif bekerja dengan benar
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          vendor: ["gsap"],
        },
      },
    },
  },
  // Pastikan base URL benar
  base: "./", // Gunakan path relatif untuk semua aset
});
