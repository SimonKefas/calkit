import { defineConfig } from 'vite';
import { resolve } from 'path';

// Vite UMD doesn't support multiple entries, so we use ES for multi-entry
// and provide a separate UMD build via rollup options.
export default defineConfig({
  root: '.',
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      formats: ['es', 'umd'],
      name: 'CalKit',
      fileName: (format) => `calkit.${format === 'es' ? 'es' : 'umd'}.js`,
    },
    sourcemap: true,
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Ensure clean chunk naming
        assetFileNames: '[name].[ext]',
      },
    },
  },
  server: {
    open: '/demo/index.html',
  },
});
