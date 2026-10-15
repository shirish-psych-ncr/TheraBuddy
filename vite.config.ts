import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['logo.png', 'apple-touch-icon.png'],
    manifest: {
      id: '/', name: 'Aasha Therapy Workspace', short_name: 'Aasha',
      description: 'Offline therapy workspace · synthetic demo',
      theme_color: '#17685b', background_color: '#f5f7f4',
      display: 'standalone', start_url: '/', scope: '/',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,woff2,woff}'],
      navigateFallbackDenylist: [/^\/api\//],
      cleanupOutdatedCaches: true,
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
    }
  })],
  build: { assetsInlineLimit: 0 },
  server: { strictPort: true },
  preview: { strictPort: true }
});
