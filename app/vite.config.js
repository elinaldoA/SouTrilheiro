import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/logo.jpeg'],
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'SouTrilheiro',
        short_name: 'SouTrilheiro',
        description: 'Descubra, percorra e compartilhe trilhas na natureza.',
        start_url: '/',
        display: 'standalone',
        background_color: '#F1F3EC',
        theme_color: '#2F5233',
        icons: [
          { src: '/icons/logo.jpeg', sizes: '192x192', type: 'image/jpeg' },
          { src: '/icons/logo.jpeg', sizes: '512x512', type: 'image/jpeg' },
        ],
      },
      workbox: {
        importScripts: ['sw-push.js'],
        runtimeCaching: [
          {
            // dados de trilhas/percursos/avaliações vindos do Supabase
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'soutrilheiro-supabase-api',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // tiles do mapa (MapTiler) — permite ver o mapa de trilhas já visitadas offline
            urlPattern: /^https:\/\/api\.maptiler\.com\/maps\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'soutrilheiro-map-tiles',
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
    setupFiles: ['./src/test-setup.js'],
  },
});
