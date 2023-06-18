Vue.createApp({
  data() {
    return {
    currentfilms: currentfilms,
    tick: 0,
    selected: 0,
    show: false
    }
  },
  computed: {
    films: function() {
      return [this.currentfilms[this.selected]];
    }
  },
  methods: {
    formatPrice: function(price) {
      return '€'.repeat(price);
    },
    shuffle: function() {
      if(this.tick++ < 25) {
        this.selected = Math.floor(Math.random() * this.currentfilms.length);
        setTimeout(this.shuffle, 10 + (this.tick * this.tick) / 2)
      } else {
        this.tick = 0;
      }
      this.show = true;
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
}).mount('#random');
