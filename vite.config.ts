import { defineConfig } from 'vite';

// Vite config for the game.
// `base: './'` keeps the built bundle relative so it works from any folder
// (GitHub Pages, itch.io, a file:// open, etc.).
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
  },
});
