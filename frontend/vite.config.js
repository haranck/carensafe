import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { FRONTEND_ROUTES } from './src/constants/frontendRoutes.js'

const DAY = 24 * 60 * 60

// Installable app: manifest + a Workbox service worker (generated at build time; off in `npm run dev`)
const pwa = VitePWA({
  // The app asks before updating (components/common/PwaUpdatePrompt.jsx): "New version available → Refresh"
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
    // Long-press the app icon
    shortcuts: [
      { name: 'Shop', url: FRONTEND_ROUTES.SHOP },
      { name: 'Wishlist', url: FRONTEND_ROUTES.WISHLIST },
      { name: 'Cart', url: FRONTEND_ROUTES.CART },
      { name: 'My Orders', url: FRONTEND_ROUTES.ORDERS },
    ].map((shortcut) => ({ ...shortcut, icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] })),
  },
  workbox: {
    // App shell only: the shopper's JS / CSS / HTML and the logo (the icons come from includeAssets + the manifest).
    // Admin-only code (dashboard charts, PDF export) and the address map (needs the network anyway) are left out, and
    // so are the large banner / photo PNGs.
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
    // Any page opened offline gets the app; API paths are never answered with index.html
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api\//],
    cleanupOutdatedCaches: true,
    // Only these GETs are cached. Everything else (our API: login, cart, orders, payments, wallet…, Razorpay, Mapbox,
    // Google sign-in) matches no route and always goes to the network.
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cloudinary-images',
          // <img> responses are opaque (status 0); they're padded in the storage quota, so clean up if it fills
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
        // Our own banners / photos in public/ (not precached because they're large)
        urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === 'image',
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'site-images', expiration: { maxEntries: 60, maxAgeSeconds: 30 * DAY } },
      },
    ],
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    pwa,
  ],
})
