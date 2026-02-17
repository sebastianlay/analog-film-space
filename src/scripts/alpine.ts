import type { Alpine } from 'alpinejs';
import { filmList } from './film-list';
import { randomFilm } from './random-film';

export default (Alpine: Alpine) => {
  Alpine.data('filmList', filmList);
  Alpine.data('randomFilm', randomFilm);
};
