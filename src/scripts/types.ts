export interface BaseFilm {
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
}

export interface Film extends BaseFilm {
  image: string;
  imageSmall: string;
}
