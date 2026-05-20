import { defineConfig } from 'vite';

export default defineConfig({
  base: '/PIXLtracker/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
  },
  server: {
    host: true, // Listen on all network interfaces for mobile testing
  }
});
