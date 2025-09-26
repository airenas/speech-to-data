/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import * as path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig, loadEnv } from 'vite';

import manifest from './manifest.json';

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const base_path = process.env.VITE_ENV_BASE_PATH || '/__BASE_PATH__/'
  return {
    plugins: [
      react(),
      VitePWA({
        manifest,
        includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        // switch to "true" to enable sw on development
        devOptions: {
          enabled: false,
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html}', '**/*.{svg,png,jpg,gif}'],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      root: path.resolve(__dirname, './src'),
    },
    base: base_path,
    server: {
      port: 8000,
      proxy: {
        '/auth/': {
          target: 'https://localhost', 
          changeOrigin: true,
          secure: false, 
        },
        '/client/': {
          target: 'https://localhost', 
          changeOrigin: true,
          secure: false, 
          ws: true,
        },
      },
    },
  };
});