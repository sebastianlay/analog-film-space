// Runs at BUILD TIME only (Astro frontmatter / SSG).
// Reads the content collections and bundles image + datasheet assets via Vite.
// Do not import from `src/client/` — those modules run in the browser.

import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';
import type { SerializedFilm } from '../client/types';

const images = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/*.avif', { eager: true });
const datasheets = import.meta.glob<string>('/src/assets/datasheets/*.pdf', { eager: true, query: '?url', import: 'default' });

// Films are displayed at 250 CSS pixels; the source images are 500px wide (2x).
// Keep these in sync with the <Image> props in FilmCard.astro so the image
// service reuses the same transforms instead of generating new ones.
export const IMAGE_WIDTH = 250;
export const IMAGE_DENSITIES = [1, 2];
export const IMAGE_FORMAT = 'avif';

export interface Film {
  name: string;
  iso: number;
  format: string;
  type: string;
  popularity: number;
  description: string;
  launched: number;
  datasheet: string | null;
  lomography: string | null;
  flickr: string | null;
  image: ImageMetadata;
}

// Fails the build with a readable message instead of a silently missing
// link (datasheets) or a cryptic TypeError (images).
function missing(what: string, path: string): never {
  throw new Error(`${what} not found at "${path}" — check data/*.json against src/assets/ (archived files in _archive/ are not bundled)`);
}

export default async function loadFilms(): Promise<Film[]> {
  const films = await getCollection('films');
  const sizes = await getCollection('sizes');

  const filmMap = new Map(films.map(f => [f.id, f]));

  return sizes.map<Film>(size => {
    const film = filmMap.get(size.data.film.id)
      ?? missing(`film "${size.data.film.id}" referenced by size "${size.data.size_id}"`, 'data/films.json');
    const imagePath = `/src/assets/images/${size.data.size_id}.avif`;
    const datasheetPath = film.data.film_datasheet ? `/src/assets/datasheets/${film.data.film_datasheet}` : null;
    return {
      name: film.data.film_name,
      iso: film.data.film_iso,
      format: size.data.size_format,
      type: film.data.film_type,
      popularity: film.data.film_popularity,
      description: film.data.film_description,
      launched: size.data.size_year,
      datasheet: datasheetPath ? (datasheets[datasheetPath] ?? missing(`datasheet for film "${film.id}"`, datasheetPath)) : null,
      lomography: film.data.film_lomography_id ? `https://www.lomography.com/films/${film.data.film_lomography_id}/photos` : null,
      flickr: film.data.film_flickr_search ? `https://www.flickr.com/search/?media=photos&text=${film.data.film_flickr_search}` : null,
      image: (images[imagePath] ?? missing(`image for size "${size.data.size_id}"`, imagePath)).default,
    };
  }).sort((a, b) => b.popularity - a.popularity || (a.name.toLowerCase() + a.format).localeCompare(b.name.toLowerCase() + b.format));
}

// Canonical conversion to the shape the browser receives. Keep all
// build → client field mapping here so the boundary stays type-checked.
// The image service generates the same 1x/2x variants FilmCard.astro uses.
export async function serializeFilm(film: Film): Promise<SerializedFilm> {
  const [small, full] = await Promise.all([
    getImage({ src: film.image, width: IMAGE_WIDTH, format: IMAGE_FORMAT }),
    getImage({ src: film.image, width: IMAGE_WIDTH * 2, format: IMAGE_FORMAT }),
  ]);
  return {
    ...film,
    image: full.src,
    imageSmall: small.src,
  };
}
