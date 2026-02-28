import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/entries/booking.js'),
      formats: ['es', 'umd'],
      name: 'CalBooking',
      fileName: (format) => `booking.${format === 'es' ? 'es' : 'umd'}.js`,
    },
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: false,
  },
});
