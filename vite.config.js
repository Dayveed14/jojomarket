import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Public, indexable routes. Signed-in areas are excluded and blocked in robots.txt.
const PUBLIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/markets', priority: '0.8', changefreq: 'weekly' },
  { path: '/register', priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
];

/** Emits sitemap.xml and robots.txt at build time using VITE_SITE_URL. */
function seoFiles(siteUrl) {
  const base = siteUrl.replace(/\/$/, '');
  return {
    name: 'jojo-seo-files',
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      const urls = PUBLIC_ROUTES.map(
        (r) => `  <url><loc>${base}${r.path === '/' ? '/' : r.path}</loc><lastmod>${today}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`,
      ).join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /admin\nDisallow: /reset-password\nDisallow: /verify-email\n\nSitemap: ${base}/sitemap.xml\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = env.VITE_SITE_URL || 'http://localhost:5173';
  process.env.VITE_SITE_URL = siteUrl; // used by %VITE_SITE_URL% in index.html

  return {
    plugins: [react(), seoFiles(siteUrl)],
    server: {
      port: 5173,
      // Same-origin in dev: the httpOnly refresh cookie just works.
      proxy: { '/api': { target: env.VITE_DEV_API_TARGET || 'http://localhost:4000', changeOrigin: false } },
    },
    build: { sourcemap: false },
  };
});
