/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

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
          target: 'http://localhost:8084',
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              const fakeUser = { id: "dev-user" };
              const json = JSON.stringify(fakeUser);
              const encoded = Buffer.from(json).toString("base64");
              proxyReq.setHeader("X-User-Info", encoded);
            });
          },
        },
      },
    },
  };
});