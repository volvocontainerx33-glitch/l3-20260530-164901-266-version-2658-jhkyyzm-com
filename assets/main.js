(function () {
  function select(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function selectAll(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function bindMenu() {
    var button = select('.menu-button');
    var panel = select('.mobile-panel');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      var open = panel.hasAttribute('hidden');
      if (open) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
      button.setAttribute('aria-expanded', String(open));
    });
  }

  function bindHero() {
    var carousel = select('[data-hero-carousel]');
    if (!carousel) {
      return;
    }
    var slides = selectAll('[data-hero-slide]', carousel);
    var dots = selectAll('[data-hero-dot]', carousel);
    var prev = select('[data-hero-prev]', carousel);
    var next = select('[data-hero-next]', carousel);
    var current = 0;
    var timer = null;

    function activate(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, position) {
        slide.classList.toggle('is-active', position === current);
      });
      dots.forEach(function (dot, position) {
        dot.classList.toggle('is-active', position === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        activate(current + 1);
      }, 5600);
    }

    dots.forEach(function (dot, position) {
      dot.addEventListener('click', function () {
        activate(position);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        activate(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        activate(current + 1);
        restart();
      });
    }

    activate(0);
    restart();
  }

  function textForCard(card) {
    return normalize([
      card.getAttribute('data-title'),
      card.getAttribute('data-genre'),
      card.getAttribute('data-tags'),
      card.getAttribute('data-region'),
      card.textContent
    ].join(' '));
  }

  function filterScope(scope, query) {
    var needle = normalize(query);
    var cards = selectAll('[data-title]', scope);
    cards.forEach(function (card) {
      var visible = !needle || textForCard(card).indexOf(needle) !== -1;
      card.classList.toggle('is-filtered-out', !visible);
    });
  }

  function bindLocalFilters() {
    selectAll('[data-local-filter]').forEach(function (form) {
      var input = select('input', form);
      var section = form.closest('section');
      var scope = section ? select('[data-filter-scope]', section) : null;
      if (!input || !scope) {
        return;
      }
      form.addEventListener('submit', function (event) {
        event.preventDefault();
      });
      input.addEventListener('input', function () {
        filterScope(scope, input.value);
      });
    });
  }

  function bindSearchPage() {
    var results = select('[data-search-results]');
    if (!results) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q') || '';
    var input = select('[data-search-input]');
    if (input) {
      input.value = q;
      input.addEventListener('input', function () {
        filterScope(results, input.value);
      });
    }
    filterScope(results, q);
  }

  window.initMoviePlayer = function (videoId, overlayId, source) {
    var video = document.getElementById(videoId);
    var overlay = document.getElementById(overlayId);
    if (!video || !source) {
      return;
    }
    var prepared = false;
    var hlsInstance = null;

    function prepare() {
      if (prepared) {
        return;
      }
      prepared = true;
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else {
        video.src = source;
      }
    }

    function start() {
      prepare();
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      var playTask = video.play();
      if (playTask && typeof playTask.catch === 'function') {
        playTask.catch(function () {});
      }
    }

    if (overlay) {
      overlay.addEventListener('click', start);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });

    video.addEventListener('play', function () {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
    });

    window.addEventListener('pagehide', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    bindMenu();
    bindHero();
    bindLocalFilters();
    bindSearchPage();
  });
})();
