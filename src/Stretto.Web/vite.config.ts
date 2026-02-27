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
<<<<<<< HEAD
      // Auth endpoints live at /auth on the backend (no /api prefix)
=======
>>>>>>> e47852d ([validator] Fix Vite proxy, add audition sign-up UI tests, update DEPLOY.md)
      '/api/auth': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/api/, ''),
        changeOrigin: true,
      },
<<<<<<< HEAD
      // All other API endpoints keep their /api prefix
=======
>>>>>>> e47852d ([validator] Fix Vite proxy, add audition sign-up UI tests, update DEPLOY.md)
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
