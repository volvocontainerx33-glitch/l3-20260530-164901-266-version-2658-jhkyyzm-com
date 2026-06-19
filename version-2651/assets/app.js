(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMenu() {
    var toggle = $('[data-menu-toggle]');
    var nav = $('[data-mobile-nav]');
    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
      document.body.classList.toggle('menu-open', nav.classList.contains('is-open'));
    });
  }

  function setupHero() {
    var hero = $('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = $all('[data-hero-slide]', hero);
    var dots = $all('[data-hero-dot]', hero);
    var prev = $('[data-hero-prev]', hero);
    var next = $('[data-hero-next]', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function loadHlsLibrary(callback) {
    if (window.Hls) {
      callback();
      return;
    }

    var existing = document.querySelector('script[data-hls-loader]');
    if (existing) {
      existing.addEventListener('load', callback, { once: true });
      return;
    }

    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    script.async = true;
    script.setAttribute('data-hls-loader', 'true');
    script.addEventListener('load', callback, { once: true });
    document.head.appendChild(script);
  }

  function playVideo(box) {
    var video = $('video', box);
    if (!video) {
      return;
    }

    var source = video.getAttribute('data-source');
    if (!source) {
      return;
    }

    function begin() {
      video.controls = true;
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {});
      }
      box.classList.add('is-playing');
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      if (!video.src) {
        video.src = source;
      }
      begin();
      return;
    }

    loadHlsLibrary(function () {
      if (window.Hls && window.Hls.isSupported()) {
        if (!video._hlsInstance) {
          video._hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          video._hlsInstance.loadSource(source);
          video._hlsInstance.attachMedia(video);
          video._hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, begin);
        } else {
          begin();
        }
      } else {
        video.src = source;
        begin();
      }
    });
  }

  function setupPlayers() {
    $all('[data-player]').forEach(function (box) {
      var startButton = $('.player-start', box);
      if (startButton) {
        startButton.addEventListener('click', function () {
          playVideo(box);
        });
      }
      box.addEventListener('click', function (event) {
        if (event.target && event.target.closest && event.target.closest('video')) {
          return;
        }
        if (!box.classList.contains('is-playing')) {
          playVideo(box);
        }
      });
    });
  }

  function movieCard(movie) {
    var tags = movie.tags.slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return [
      '<article class="movie-card grid">',
      '  <a class="poster-link" href="' + movie.url + '" aria-label="观看' + escapeHtml(movie.title) + '">',
      '    <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '    <span class="poster-badge">' + escapeHtml(movie.year) + '</span>',
      '  </a>',
      '  <div class="movie-card-body">',
      '    <div class="movie-meta-line">',
      '      <span>' + escapeHtml(movie.region) + '</span>',
      '      <span>' + escapeHtml(movie.type) + '</span>',
      '    </div>',
      '    <h2><a href="' + movie.url + '">' + escapeHtml(movie.title) + '</a></h2>',
      '    <p>' + escapeHtml(movie.oneLine) + '</p>',
      '    <div class="tag-row">' + tags + '</div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[char];
    });
  }

  function setupSearch() {
    var form = $('[data-search-form]');
    var input = $('[data-search-input]');
    var results = $('[data-search-results]');
    var title = $('[data-search-title]');
    if (!form || !input || !results || !window.MOVIE_SEARCH_DATA) {
      return;
    }

    function render(query) {
      var q = query.trim().toLowerCase();
      if (!q) {
        title.textContent = '精选推荐';
        results.innerHTML = window.MOVIE_SEARCH_DATA.slice(0, 12).map(movieCard).join('');
        return;
      }

      var matched = window.MOVIE_SEARCH_DATA.filter(function (movie) {
        return movie.searchText.indexOf(q) !== -1;
      }).slice(0, 80);

      title.textContent = '搜索结果：' + matched.length + ' 条';
      results.innerHTML = matched.length ? matched.map(movieCard).join('') : '<p class="empty-tip">未找到匹配影片。</p>';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      render(input.value);
    });

    input.addEventListener('input', function () {
      render(input.value);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupPlayers();
    setupSearch();
  });
})();
