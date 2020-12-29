const app = new Vue({
  el: "#random",
  data: {
    currentfilms: currentfilms,
    tick: 0,
    selected: 0,
    show: false
  },
  computed: {
    films: function() {
      return [this.currentfilms[this.selected]];
    }
  },
  methods: {
    formatPrice: function(price) {
      return "€".repeat(price);
    },
    shuffle: function() {
      if(this.tick++ < 25) {
        this.selected = Math.floor(Math.random() * this.currentfilms.length);
        setTimeout(this.shuffle, 10 + (this.tick * this.tick) / 2)
      } else {
        this.tick = 0;
      }
      this.show = true;
    }
  }
});