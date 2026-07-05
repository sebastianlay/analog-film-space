import type { APIRoute } from 'astro';
import favicon from '../assets/favicon.svg?url';
import icon192 from '../assets/icon-192.png?url';
import icon256 from '../assets/icon-256.png?url';

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
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: icon192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: icon256,
        sizes: '256x256',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
