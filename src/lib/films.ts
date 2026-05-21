// Runs at BUILD TIME only (Astro frontmatter / SSG).
// Reads the content collections and bundles image + datasheet assets via Vite.
// Do not import from `src/client/` — those modules run in the browser.

import { getCollection } from 'astro:content';
import type { SerializedFilm } from '../client/types';

const fullImages = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/*.avif', { eager: true });
const smallImages = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/small/*.avif', { eager: true });
const datasheets = import.meta.glob<string>('/src/assets/datasheets/*.pdf', { eager: true, query: '?url', import: 'default' });

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
  imageSmall: ImageMetadata;
}

export default async function loadFilms(): Promise<Film[]> {
  const films = await getCollection('films');
  const sizes = await getCollection('sizes');

  const filmMap = new Map(films.map(f => [f.id, f]));

  return sizes.map<Film>(size => {
    const film = filmMap.get(size.data.film.id)!;
    const filename = `${size.data.size_id}.avif`;
    return {
      name: film.data.film_name,
      iso: film.data.film_iso,
      format: size.data.size_format,
      type: film.data.film_type,
      popularity: film.data.film_popularity,
      description: film.data.film_description,
      launched: size.data.size_year,
      datasheet: film.data.film_datasheet ? datasheets[`/src/assets/datasheets/${film.data.film_datasheet}`] : null,
      lomography: film.data.film_lomography_id ? `https://www.lomography.com/films/${film.data.film_lomography_id}/photos` : null,
      flickr: film.data.film_flickr_search ? `https://www.flickr.com/search/?media=photos&text=${film.data.film_flickr_search}` : null,
      image: fullImages[`/src/assets/images/${filename}`].default,
      imageSmall: smallImages[`/src/assets/images/small/${filename}`].default,
    };
  }).sort((a, b) => b.popularity - a.popularity || (a.name.toLowerCase() + a.format).localeCompare(b.name.toLowerCase() + b.format));
}

// Canonical conversion to the shape the browser receives. Keep all
// build → client field mapping here so the boundary stays type-checked.
export function serializeFilm(film: Film): SerializedFilm {
  return {
    ...film,
    image: film.image.src,
    imageSmall: film.imageSmall.src,
  };
}
