import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: '/inventory-count/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: '仓库库存盘点系统',
        short_name: '盘点系统',
        description: '仓库库存盘点管理与执行',
        theme_color: '#1677ff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/inventory-count/',
        scope: '/inventory-count/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@providers': path.resolve(__dirname, './src/providers'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@web': path.resolve(__dirname, './src/web'),
      '@mobile': path.resolve(__dirname, './src/mobile'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@db': path.resolve(__dirname, './src/db'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
