import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/entries/timepicker.js'),
      formats: ['es', 'umd'],
      name: 'CalTimepicker',
      fileName: (format) => `timepicker.${format === 'es' ? 'es' : 'umd'}.js`,
    },
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: false,
  },
});
