import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the site from https://<user>.github.io/<repo>/, so all
// asset/start URLs must be relative to the repo base. Set AASHA_BASE (or the
// repository name) when building for Pages; "/" keeps Cloudflare Workers hosting.
const isPages = process.env.GITHUB_PAGES === 'true' || process.env.AASHA_BASE !== undefined;
const base = process.env.AASHA_BASE ?? (isPages && process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/');
const icon = (name: string) => `${base}${name}`.replace(/\/{2,}/g, '/').replace(/^([^/])/, '/$1');

export default defineConfig({
  base,
  define: { "import.meta.env.VITE_STATIC_HOST": JSON.stringify(isPages ? "true" : "false") },
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['logo.png', 'apple-touch-icon.png'],
    manifest: {
      id: base, name: 'Aasha Therapy Workspace', short_name: 'Aasha',
      description: 'Offline therapy workspace · synthetic demo',
      theme_color: '#17685b', background_color: '#f5f7f4',
      display: 'standalone', start_url: base, scope: base,
      icons: [
        { src: icon('icon-192.png'), sizes: '192x192', type: 'image/png' },
        { src: icon('icon-512.png'), sizes: '512x512', type: 'image/png' },
        { src: icon('icon-maskable.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,woff2,woff}'],
      globIgnores: ['**/staff.html'],
      // On Pages there is no same-origin API; denylist stays harmless and keeps
      // Worker-hosted /api and /staff responses out of the offline fallback.
      navigateFallbackDenylist: [/^\/api(?:\/|$)/, /\/staff(?:\.html|\/|$)/, /^\/cdn-cgi\//],
      cleanupOutdatedCaches: true,
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
    }
  })],
  build: {
    assetsInlineLimit: 0,
    // Pages builds keep the default single index.html entry; /staff.html is
    // copied by the deploy workflow so the footer link works on static hosts.
    rollupOptions: isPages ? { input: { main: 'index.html', staff: 'staff.html' } } : undefined,
  },
  server: { strictPort: true },
  preview: { strictPort: true }
});
