import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/login': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/signup': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
