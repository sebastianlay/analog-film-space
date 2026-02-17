import type { APIRoute } from 'astro';
import favicon from '../assets/favicon.svg?url';
import appleTouchIcon from '../assets/apple-touch-icon-precomposed.avif?url';

export const GET: APIRoute = () => {
  const manifest = {
    name: 'analog film',
    short_name: 'analog film',
    start_url: '/',
    display: 'standalone',
    background_color: '#ccc',
    theme_color: '#000',
    description: 'a database of currently available 35mm, 110 and medium format film stocks',
    icons: [
      {
        src: favicon,
        sizes: 'any',
        purpose: 'any maskable',
      },
      {
        src: appleTouchIcon,
        sizes: '256x256',
        type: 'image/avif',
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
