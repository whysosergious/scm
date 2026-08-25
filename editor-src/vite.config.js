import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '../web/scripts/vendor',
    emptyOutDir: false,
    lib: {
      entry: 'src/main.js',
      formats: ['es'],
      fileName: () => 'rich-editor.bundle.js',
    },
    rollupOptions: {
      output: {
        // single self-contained file, no code splitting
        manualChunks: undefined,
      },
    },
  },
});
