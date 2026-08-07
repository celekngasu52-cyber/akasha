import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// base '/akasha/' dipakai saat dijalankan di GitHub Actions (CI build
// untuk GitHub Pages di https://<user>.github.io/akasha/). Lokal tetap '/'
// agar dev server & PWA tidak terpengaruh.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/akasha/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Cache-first for static assets; network-first fallback for navigations.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /\.(?:svg|woff2|css|js)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'akasha-static',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: 'Akasha',
        short_name: 'Akasha',
        description: 'Mesin astrologi multi-tradisi dengan lapisan sintesis.',
        theme_color: '#1a1612',
        background_color: '#1a1612',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: '/icons/icon-maskable.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
