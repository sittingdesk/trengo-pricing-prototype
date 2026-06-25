import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
// Builds a single self-contained dist/index.html (JS + CSS + fonts inlined)
// that opens by double-click — no dev server / localhost required.
export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Inline every asset (fonts included) so the output is one portable file.
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
  server: {
    // Dedicated port so the preview doesn't collide with other dev servers.
    port: 5183,
    strictPort: true,
  },
})
