Vue.createApp({
  data() {
    return {
    currentfilms: currentfilms,
    search: '',
    type: 'all',
    format: 'all',
    sortBy: 'popularity',
    sortDir: 'desc'
    }
  },
  computed: {
    searchedfilms: function() {
      if(this.search) {
        var searchTerms = this.search.toLowerCase().split(' ');
        return this.currentfilms.filter(function (film) {
          const name = film.name.toLowerCase();
          const description = film.description.toLowerCase();
          const company = film.company.toLowerCase();
          const matches = (searchTerm) => name.includes(searchTerm) || description.includes(searchTerm) || company.includes(searchTerm);
          return searchTerms.every(matches);
        });
      } else {
        return this.currentfilms;
      }
    },
    filteredfilms: function() {
      var format = this.format;
      var type = this.type;
      if(type === 'all' && format === 'all') {
        return this.searchedfilms;
      } else if(type === 'all' && format !== 'all') {
        return this.searchedfilms.filter(function (film) {
          return format === film.format;
        });
      } else if(this.type !== 'all' && this.format === 'all') {
        return this.searchedfilms.filter(function (film) {
          return type === film.color + film.type;
        });
      } else {
        return this.searchedfilms.filter(function (film) {
          return type === film.color + film.type && format === film.format;
        });
      }
    },
    sortedfilms: function() {
      var sortBy = this.sortBy;
      var sortDir = this.sortDir;
      var sorted = this.filteredfilms.sort(function (a, b) {
        var first = a.name.toLowerCase() + a.format;
        var second = b.name.toLowerCase() + b.format;
        switch(sortBy) {
          case 'popularity':
            return a.popularity - b.popularity || first.localeCompare(second);
          case 'name':
            return first.localeCompare(second);
          case 'price':
            return a.price - b.price || first.localeCompare(second);
          case 'iso':
            return a.iso - b.iso || first.localeCompare(second);
          case 'date':
            return a.launched - b.launched || first.localeCompare(second);
        }
      });
      if(sortDir === 'asc') {
        return sorted;
      } else {
        return sorted.reverse();
      }
    },
    films: function() {
      return this.sortedfilms;
    }
  },
  methods: {
    formatPrice: function(price) {
      return "€".repeat(price);
    },
    sort: function(button) {
      if(this.sortBy === button.target.innerText.toLowerCase()) {
        this.sortDir === 'asc' ? this.sortDir = 'desc' : this.sortDir = 'asc';
      } else {
        this.sortBy = button.target.innerText.toLowerCase();
      }
    },
    toggle: function() {
      if(document.querySelector('body').classList.contains('dark')) {
        localStorage.setItem('theme', 'light');
        document.querySelector('body').classList.remove('dark');
      } else {
        localStorage.setItem('theme', 'dark');
        document.querySelector('body').classList.add('dark');
      }
    }
  },
  mounted: function() {
    if(localStorage.getItem('theme') !== 'dark') {
      document.querySelector('body').classList.remove('dark');
    }
  }
}).mount('#app');
