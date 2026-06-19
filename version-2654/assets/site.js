(function () {
  var hlsLoading = false;
  var hlsCallbacks = [];

  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  function initMobileMenu() {
    var button = document.querySelector('[data-mobile-toggle]');
    if (!button) {
      return;
    }
    button.addEventListener('click', function () {
      document.body.classList.toggle('menu-open');
    });
  }

  function initHero() {
    var slides = selectAll('[data-hero-slide]');
    if (slides.length === 0) {
      return;
    }

    var dots = selectAll('[data-hero-dot]');
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    selectAll('[data-hero-prev]').forEach(function (button) {
      button.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    });

    selectAll('[data-hero-next]').forEach(function (button) {
      button.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    });

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
    });

    show(0);
    start();
  }

  function initFilters() {
    var panels = selectAll('[data-filter-panel]');
    panels.forEach(function (panel) {
      var scope = panel.getAttribute('data-filter-panel') || document.body;
      var root = document.querySelector(scope) || document;
      var cards = selectAll('[data-movie-card]', root);
      var queryInput = panel.querySelector('[data-filter-query]');
      var categorySelect = panel.querySelector('[data-filter-category]');
      var typeSelect = panel.querySelector('[data-filter-type]');
      var regionSelect = panel.querySelector('[data-filter-region]');
      var summary = document.querySelector(panel.getAttribute('data-filter-summary'));
      var empty = document.querySelector(panel.getAttribute('data-empty-state'));

      function apply() {
        var query = normalize(queryInput && queryInput.value);
        var category = normalize(categorySelect && categorySelect.value);
        var type = normalize(typeSelect && typeSelect.value);
        var region = normalize(regionSelect && regionSelect.value);
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-genre'),
            card.getAttribute('data-tags'),
            card.getAttribute('data-category')
          ].join(' '));

          var ok = true;
          if (query && haystack.indexOf(query) === -1) {
            ok = false;
          }
          if (category && normalize(card.getAttribute('data-category')) !== category) {
            ok = false;
          }
          if (type && normalize(card.getAttribute('data-type')).indexOf(type) === -1) {
            ok = false;
          }
          if (region && normalize(card.getAttribute('data-region')).indexOf(region) === -1) {
            ok = false;
          }

          card.classList.toggle('hidden-card', !ok);
          if (ok) {
            visible += 1;
          }
        });

        if (summary) {
          summary.textContent = '当前显示 ' + visible + ' 部，共 ' + cards.length + ' 部。';
        }
        if (empty) {
          empty.classList.toggle('is-visible', visible === 0);
        }
      }

      [queryInput, categorySelect, typeSelect, regionSelect].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });

      apply();
    });
  }

  function loadHls(callback) {
    if (window.Hls) {
      callback();
      return;
    }

    hlsCallbacks.push(callback);
    if (hlsLoading) {
      return;
    }

    hlsLoading = true;
    var cdnList = [
      'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js',
      'https://unpkg.com/hls.js@1.5.20/dist/hls.min.js',
      'https://cdn.bootcdn.net/ajax/libs/hls.js/1.5.20/hls.min.js'
    ];
    var cdnIndex = 0;

    function finish(error) {
      hlsLoading = false;
      hlsCallbacks.splice(0).forEach(function (fn) {
        fn(error);
      });
    }

    function tryNext() {
      var src = cdnList[cdnIndex];
      cdnIndex += 1;
      if (!src) {
        finish(new Error('hls-load-failed'));
        return;
      }

      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = function () {
        finish();
      };
      script.onerror = tryNext;
      document.head.appendChild(script);
    }

    tryNext();
  }

  function initPlayers() {
    selectAll('[data-player]').forEach(function (shell) {
      var video = shell.querySelector('video');
      var button = shell.querySelector('[data-play-button]');
      var status = document.querySelector(shell.getAttribute('data-status-target'));
      if (!video || !button) {
        return;
      }

      function setStatus(text) {
        if (status) {
          status.textContent = text;
        }
      }

      function play() {
        var src = video.getAttribute('data-src');
        if (!src) {
          setStatus('当前影片暂未配置播放源。');
          return;
        }

        shell.classList.add('is-playing');
        setStatus('正在载入高清播放源...');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          if (!video.getAttribute('src')) {
            video.setAttribute('src', src);
          }
          video.play().then(function () {
            setStatus('播放中。');
          }).catch(function () {
            setStatus('浏览器阻止了自动播放，请再次点击视频播放。');
          });
          return;
        }

        loadHls(function (error) {
          if (error || !window.Hls || !window.Hls.isSupported()) {
            setStatus('当前浏览器无法载入 HLS 播放模块，请使用支持 HLS 的浏览器访问。');
            return;
          }
          if (!video._staticMovieHls) {
            var hls = new window.Hls({
              maxBufferLength: 30,
              enableWorker: true
            });
            hls.loadSource(src);
            hls.attachMedia(video);
            video._staticMovieHls = hls;
          }
          video.play().then(function () {
            setStatus('播放中。');
          }).catch(function () {
            setStatus('浏览器阻止了自动播放，请再次点击视频播放。');
          });
        });
      }

      button.addEventListener('click', play);
      video.addEventListener('play', function () {
        shell.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        if (video.currentTime === 0 || video.ended) {
          shell.classList.remove('is-playing');
        }
      });
      video.addEventListener('error', function () {
        setStatus('播放源载入失败，请稍后重试。');
      });
    });
  }

  function initQuickSearch() {
    var quick = document.querySelector('[data-quick-search]');
    if (!quick) {
      return;
    }
    quick.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') {
        return;
      }
      var target = document.querySelector('[data-filter-query]');
      if (target) {
        target.value = quick.value;
        target.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('#movie-library')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = './index.html#movie-library';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHero();
    initFilters();
    initPlayers();
    initQuickSearch();
  });
})();
