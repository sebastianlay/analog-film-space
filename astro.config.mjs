import { defineConfig, fontProviders } from 'astro/config';

import alpinejs from '@astrojs/alpinejs';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://analogfilm.space',
  trailingSlash: 'never',
  output: 'static',
  compressHTML: false,
  prefetch: true,

  build: {
    format: 'directory',
    assets: 'assets'
  },

  vite: {
    build: {
      assetsInlineLimit: 0
    }
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

  integrations: [alpinejs({ entrypoint: '/src/scripts/alpine.ts' }), sitemap()]
});