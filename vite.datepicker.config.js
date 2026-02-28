import { defineConfig } from 'vite';
import { resolve } from 'path';

// Standalone datepicker-only build
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/entries/datepicker.js'),
      formats: ['es', 'umd'],
      name: 'CalDatepicker',
      fileName: (format) => `datepicker.${format === 'es' ? 'es' : 'umd'}.js`,
    },
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: false,
  },
});
