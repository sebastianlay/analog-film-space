import { defineCollection, reference, z } from 'astro:content';
import { file } from 'astro/loaders';

const films = defineCollection({
  loader: file('data/films.json', {
    parser: (text) => JSON.parse(text).map((entry: { film_id: string }) => ({ ...entry, id: entry.film_id })),
  }),
  schema: z.object({
    film_id: z.string(),
    film_name: z.string(),
    film_iso: z.number().positive(),
    film_description: z.string(),
    film_type: z.enum(['black & white', 'color (C-41)', 'color (E-6)', 'color (ECN-2)']),
    film_popularity: z.number().nonnegative(),
    film_datasheet: z.string().nullable(),
    film_lomography_id: z.string().nullable(),
    film_flickr_search: z.string().nullable(),
  }),
});

const sizes = defineCollection({
  loader: file('data/sizes.json', {
    parser: (text) => JSON.parse(text).map(({ film_id, ...entry }: { size_id: string; film_id: string }) => ({ ...entry, id: entry.size_id, film: film_id })),
  }),
  schema: z.object({
    size_id: z.string(),
    film: reference('films'),
    size_format: z.enum(['110', '120', '135']),
    size_year: z.number().int().min(1950).max(new Date().getFullYear()),
  }).superRefine((data, ctx) => {
    if (data.size_id !== `${data.film.id}-${data.size_format}`) {
      ctx.addIssue({ code: 'custom', message: `expected "${data.film.id}-${data.size_format}", got "${data.size_id}"`, path: ['size_id'] });
    }
  }),
});

export const collections = { films, sizes };
