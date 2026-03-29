import type { Magics } from 'alpinejs';

interface FilmListData {
  search: string;
  type: string;
  format: string;
  currentSort: string;
  currentDir: string;
  matchCount: number;
  init(): void;
  readonly items: HTMLLIElement[];
  applyFilters(): void;
  sortBy(field: string): void;
  reset(): void;
}

type FilmList = FilmListData & Magics<FilmListData>;

export const filmList = () => ({
  search: '',
  type: 'all',
  format: 'all',
  currentSort: 'popularity',
  currentDir: 'desc',
  matchCount: 0,

  init(this: FilmList) {
    this.matchCount = this.items.length;
    this.$watch('search', () => this.applyFilters());
    this.$watch('type', () => this.applyFilters());
    this.$watch('format', () => this.applyFilters());
    this.$watch('currentSort', () => this.applyFilters());
    this.$watch('currentDir', () => this.applyFilters());
  },

  get items(): HTMLLIElement[] {
    return Array.from((this as unknown as FilmList).$refs.list.querySelectorAll<HTMLLIElement>('li[data-name]'));
  },

  applyFilters(this: FilmList) {
    const terms = this.search.toLowerCase().split(' ').filter(Boolean);
    const typeFilter = this.type;
    const formatFilter = this.format;
    const sortKey = this.currentSort;
    const dir = this.currentDir === 'asc' ? 1 : -1;
    const list = this.$refs.list;

    const visible: HTMLLIElement[] = [];
    for (const li of this.items) {
      const name = li.dataset.name!;
      const desc = li.dataset.description!;
      const type = li.dataset.type!;
      const format = li.dataset.format!;

      let match = true;
      if (terms.length) {
        match = terms.every(t => name.includes(t) || desc.includes(t));
      }
      if (match && typeFilter !== 'all') {
        match = type === typeFilter;
      }
      if (match && formatFilter !== 'all') {
        match = format === formatFilter;
      }

      li.style.display = match ? '' : 'none';
      if (match) visible.push(li);
    }
    this.matchCount = visible.length;

    const sorted = visible.sort((a, b) => {
      const nameA = a.dataset.name! + a.dataset.format!;
      const nameB = b.dataset.name! + b.dataset.format!;
      switch (sortKey) {
        case 'popularity': return (Number(a.dataset.popularity) - Number(b.dataset.popularity)) * dir || nameA.localeCompare(nameB);
        case 'name': return nameA.localeCompare(nameB) * dir;
        case 'iso': return (Number(a.dataset.iso) - Number(b.dataset.iso)) * dir || nameA.localeCompare(nameB);
        case 'date': return (Number(a.dataset.launched) - Number(b.dataset.launched)) * dir || nameA.localeCompare(nameB);
        default: return 0;
      }
    });

    for (const li of sorted) {
      list.appendChild(li);
    }
  },

  sortBy(this: FilmList, field: string) {
    if (this.currentSort === field) {
      this.currentDir = this.currentDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort = field;
    }
  },

  reset(this: FilmList) {
    this.search = '';
    this.type = 'all';
    this.format = 'all';
  }
});
