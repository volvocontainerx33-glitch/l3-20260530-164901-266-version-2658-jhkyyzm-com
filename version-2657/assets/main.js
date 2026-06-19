(function () {
  var navToggle = document.querySelector('.nav-toggle');
  var mobilePanel = document.querySelector('.mobile-panel');

  if (navToggle && mobilePanel) {
    navToggle.addEventListener('click', function () {
      mobilePanel.classList.toggle('open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
  var activeIndex = 0;

  function showHero(index) {
    if (!slides.length) {
      return;
    }

    activeIndex = (index + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('active', slideIndex === activeIndex);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('active', dotIndex === activeIndex);
    });
  }

  dots.forEach(function (dot, dotIndex) {
    dot.addEventListener('click', function () {
      showHero(dotIndex);
    });
  });

  if (slides.length > 1) {
    window.setInterval(function () {
      showHero(activeIndex + 1);
    }, 5200);
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  var filterRoot = document.querySelector('[data-filter-root]');

  if (filterRoot) {
    var searchInput = filterRoot.querySelector('[data-filter-text]');
    var typeSelect = filterRoot.querySelector('[data-filter-type]');
    var regionSelect = filterRoot.querySelector('[data-filter-region]');
    var yearSelect = filterRoot.querySelector('[data-filter-year]');
    var clearButton = filterRoot.querySelector('[data-filter-clear]');
    var cards = Array.prototype.slice.call(filterRoot.querySelectorAll('.search-card'));
    var empty = filterRoot.querySelector('.search-empty');

    function applyFilter() {
      var query = normalize(searchInput && searchInput.value);
      var typeValue = normalize(typeSelect && typeSelect.value);
      var regionValue = normalize(regionSelect && regionSelect.value);
      var yearValue = normalize(yearSelect && yearSelect.value);
      var visibleCount = 0;

      cards.forEach(function (card) {
        var text = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-year'),
          card.getAttribute('data-genre')
        ].join(' '));

        var matches = true;

        if (query && text.indexOf(query) === -1) {
          matches = false;
        }

        if (typeValue && normalize(card.getAttribute('data-type')) !== typeValue) {
          matches = false;
        }

        if (regionValue && normalize(card.getAttribute('data-region')) !== regionValue) {
          matches = false;
        }

        if (yearValue && normalize(card.getAttribute('data-year')) !== yearValue) {
          matches = false;
        }

        card.style.display = matches ? '' : 'none';
        if (matches) {
          visibleCount += 1;
        }
      });

      if (empty) {
        empty.style.display = visibleCount ? 'none' : 'block';
      }
    }

    [searchInput, typeSelect, regionSelect, yearSelect].forEach(function (item) {
      if (item) {
        item.addEventListener('input', applyFilter);
        item.addEventListener('change', applyFilter);
      }
    });

    if (clearButton) {
      clearButton.addEventListener('click', function () {
        if (searchInput) {
          searchInput.value = '';
        }
        if (typeSelect) {
          typeSelect.value = '';
        }
        if (regionSelect) {
          regionSelect.value = '';
        }
        if (yearSelect) {
          yearSelect.value = '';
        }
        applyFilter();
      });
    }

    var params = new URLSearchParams(window.location.search);
    var queryParam = params.get('q');
    if (queryParam && searchInput) {
      searchInput.value = queryParam;
    }

    applyFilter();
  }
})();

function initMoviePlayer(videoUrl, videoId, buttonId) {
  var video = document.getElementById(videoId);
  var button = document.getElementById(buttonId);
  var loaded = false;
  var hls = null;

  if (!video) {
    return;
  }

  function attachMedia() {
    if (loaded) {
      return;
    }

    loaded = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      return;
    }

    video.src = videoUrl;
  }

  function beginPlay() {
    attachMedia();

    if (button) {
      button.classList.add('is-hidden');
    }

    var playResult = video.play();

    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(function () {
        if (button) {
          button.classList.remove('is-hidden');
        }
      });
    }
  }

  if (button) {
    button.addEventListener('click', beginPlay);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      beginPlay();
    }
  });

  video.addEventListener('play', function () {
    if (button) {
      button.classList.add('is-hidden');
    }
  });

  video.addEventListener('ended', function () {
    if (button) {
      button.classList.remove('is-hidden');
    }
  });

  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });
}
