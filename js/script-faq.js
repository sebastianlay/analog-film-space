Vue.createApp({
  methods: {
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
}).mount('#faq');
