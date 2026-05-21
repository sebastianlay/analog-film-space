// Types for data that crosses the build → browser boundary.
// `Film` (from src/lib/films.ts) contains Astro `ImageMetadata` objects; once
// serialized to JSON for the client, every such field becomes a plain URL
// string. The mapped type below performs that conversion automatically, so
// adding a new `ImageMetadata` field to `Film` forces `serializeFilm` to
// produce a string for it (or fail to type-check).

import type { Film } from '../lib/films';

export type SerializedFilm = {
  [K in keyof Film]: Film[K] extends ImageMetadata ? string : Film[K];
};
