import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Add any aliases you might need
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
  },
  // Required for axios and other packages that use Node.js modules
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      // Tell esbuild to use JSX in .js files
      loader: {
        '.js': 'jsx'
      }
    },
  },
  // Also tell Vite itself to handle JSX in .js files
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
}); 