import type { Film } from './types';

interface RandomFilmData {
  films: Film[];
  film: Film;
  tick: number;
  show: boolean;
  shuffle(): void;
}

export const randomFilm = () => {
  const films: Film[] = JSON.parse(document.getElementById('films-data')!.textContent!);
  return {
    films,
    film: films[0],
    tick: 0,
    show: false,
    shuffle(this: RandomFilmData) {
      if (this.tick++ < 25) {
        this.film = this.films[Math.floor(Math.random() * this.films.length)];
        setTimeout(() => this.shuffle(), 10 + (this.tick * this.tick) / 2);
      } else {
        this.tick = 0;
      }
      this.show = true;
    }
  };
};
