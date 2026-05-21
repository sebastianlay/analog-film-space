// Runs in the BROWSER only. Alpine component for the "random film" page.
// Hydrates from a <script type="application/json" id="films-data"> blob
// that the page emitted at build time (see src/pages/random.astro).

import type { SerializedFilm } from './types';

interface RandomFilmData {
  films: SerializedFilm[];
  film: SerializedFilm;
  tick: number;
  show: boolean;
  shuffle(): void;
}

export const randomFilm = () => {
  const films: SerializedFilm[] = JSON.parse(document.getElementById('films-data')!.textContent!);
  return {
    films,
    film: films[0],
    tick: 0,
    show: false,
    shuffle(this: RandomFilmData) {
      this.film = this.films[Math.floor(Math.random() * this.films.length)];
      this.show = true;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (this.tick++ < 25) {
        setTimeout(() => this.shuffle(), 10 + (this.tick * this.tick) / 2);
      } else {
        this.tick = 0;
      }
    }
  };
};
