import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { FRONTEND_ROUTES } from './src/constants/frontendRoutes.js'

const DAY = 24 * 60 * 60

const pwa = VitePWA({
  registerType: 'prompt',
  devOptions: { enabled: false },
  includeAssets: ['favicon.png', 'icons/apple-touch-icon-180.png'],
  manifest: {
    id: '/',
    name: 'Care N Safe',
    short_name: 'Care N Safe',
    description: '100% organic cotton, rash-free sanitary pads, delivered to your door.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#060049',
    background_color: '#fdfbff',
    lang: 'en-IN',
    categories: ['shopping', 'health'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Shop', url: FRONTEND_ROUTES.SHOP },
      { name: 'Wishlist', url: FRONTEND_ROUTES.WISHLIST },
      { name: 'Cart', url: FRONTEND_ROUTES.CART },
      { name: 'My Orders', url: FRONTEND_ROUTES.ORDERS },
    ].map((shortcut) => ({
      ...shortcut,
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    })),
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html}', 'logo.webp'],
    globIgnores: [
      '**/Admin*.js',
      '**/ReportHooks-*.js',
      '**/salesReportPdf-*.js',
      '**/jspdf*.js',
      '**/html2canvas-*.js',
      '**/purify.es-*.js',
      '**/index.es-*.js',
      '**/LocationPicker-*.{js,css}',
    ],
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api\//],
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cloudinary-images',
          cacheableResponse: { statuses: [0, 200] },
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * DAY, purgeOnQuotaError: true },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'google-fonts-css', cacheableResponse: { statuses: [0, 200] } },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-files',
          cacheableResponse: { statuses: [0, 200] },
          expiration: { maxEntries: 30, maxAgeSeconds: 365 * DAY },
        },
      },
      {
        urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === 'image',
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'site-images', expiration: { maxEntries: 60, maxAgeSeconds: 30 * DAY } },
      },
    ],
  },
})

export default defineConfig({
  plugins: [tailwindcss(), react(), pwa],
})
