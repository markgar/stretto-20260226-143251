import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: true,
    proxy: {
      // Auth endpoints live at /auth on the backend (no /api prefix)
      '/api/auth': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/api/, ''),
        changeOrigin: true,
      },
      // All other API endpoints keep their /api prefix
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
  },
});
