import { defineConfig, fontProviders } from 'astro/config';
import alpinejs from '@astrojs/alpinejs';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://analogfilm.space',
  output: 'static',
  compressHTML: false,
  prefetch: true,

  build: {
    format: 'directory',
    assets: 'assets'
  },

  vite: {
    build: {
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.names?.some(n => n.endsWith('.css'))) {
              return 'assets/style.[hash][extname]';
            }
            return 'assets/[name].[hash][extname]';
          },
        },
      },
    },
    environments: {
      client: {
        build: {
          rollupOptions: {
            output: {
              manualChunks: () => 'main',
              entryFileNames: 'assets/script.[hash].js',
            },
          },
        },
      },
    },
  },

  fonts: [{
    provider: fontProviders.google(),
    name: 'Mukta',
    cssVariable: '--font-ek-mukta',
    weights: [400, 700],
    styles: ['normal'],
    subsets: ['latin'],
    display: 'swap',
    fallbacks: ['sans-serif'],
  }],

  integrations: [alpinejs({ entrypoint: '/src/client/entry.ts' }), sitemap()]
});
