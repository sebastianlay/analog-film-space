Vue.createApp({
  data() {
    return {
    currentfilms: currentfilms,
    guide: guide,
    step: 1
    }
  },
  computed: {
    films: function() {
      var step = this.step;
      var films = guide.filter(function(guide) {
        return guide.step === step;
      })[0].films;
      if(films) {
        return this.currentfilms.filter(function (film) {
          for (var i = 0; i < films.length; i++) {
            if(films[i].name === film.name &&
              films[i].format === film.format)
              return true;
          }
          return false;
        });
      } else {
        return [];
      }
    },
    currenttext: function() {
      var step = this.step;
      return guide.filter(function(guide) {
        return guide.step === step;
      })[0].text;
    },
    currenttitle: function() {
      var step = this.step;
      return guide.filter(function(guide) {
        return guide.step === step;
      })[0].title;
    },
    previousstep: function() {
      var step = this.step;
      return guide.filter(function(guide) {
        return guide.step === step;
      })[0].previous;
    },
    answers: function() {
      var step = this.step;
      return guide.filter(function(guide) {
        return guide.step === step;
      })[0].answers;
    }
  },
  methods: {
    formatPrice: function(price) {
      return "€".repeat(price);
    },
    goto: function(step) {
      this.step = step;
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
}).mount('#guide');