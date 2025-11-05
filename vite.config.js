import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          ui: ['./assets/js/sidebar.js', './assets/js/theme.js'],
        },
      },
    },
  },
});
