import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '../scripts/vendor',
    minify: false,
    emptyOutDir: false,
    lib: {
      entry: 'src/main.js',
      formats: ['es'],
      fileName: () => 'code-editor.bundle.js',
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
