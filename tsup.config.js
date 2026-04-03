import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.jsx'],
  format: ['esm'],
  clean: true,
  dts: false,
  sourcemap: true,
  minify: false,
  outDir: 'dist',
  shims: true, // Ayuda con compatibilidad ESM
  banner: {
    js: '#!/usr/bin/env node',
  },
  loader: {
    '.js': 'jsx',
  },
});
