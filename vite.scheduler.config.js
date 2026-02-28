import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/entries/scheduler.js'),
      formats: ['es', 'umd'],
      name: 'CalScheduler',
      fileName: (format) => `scheduler.${format === 'es' ? 'es' : 'umd'}.js`,
    },
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: false,
  },
});
