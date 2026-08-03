import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/embed.js'),
      name: 'Encore',
      fileName: () => 'embed.js',
      formats: ['iife'],
    },
    cssCodeSplit: false,
  },
});
