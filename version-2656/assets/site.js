(function () {
  function qsa(root, sel) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function qs(root, sel) {
    return (root || document).querySelector(sel);
  }

  function setActiveNav() {
    var path = location.pathname.split('/').pop() || 'index.html';
    qsa(document, '[data-nav-link]').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (href.endsWith(path)) {
        link.classList.add('active');
      }
    });
  }

  function setupMobileMenu() {
    var btn = qs(document, '[data-menu-toggle]');
    var nav = qs(document, '[data-nav-links]');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');
    });
  }

  function normalizeText(text) {
    return (text || '').toLowerCase();
  }

  function setupFilters() {
    qsa(document, '[data-filter-input]').forEach(function (input) {
      var target = document.getElementById(input.getAttribute('data-filter-target'));
      if (!target) return;
      var cards = qsa(target, '[data-filter-item]');
      function apply() {
        var value = normalizeText(input.value.trim());
        cards.forEach(function (card) {
          var haystack = normalizeText([
            card.getAttribute('data-title'),
            card.getAttribute('data-genre'),
            card.getAttribute('data-region'),
            card.getAttribute('data-tags'),
            card.getAttribute('data-year')
          ].join(' '));
          card.style.display = !value || haystack.indexOf(value) !== -1 ? '' : 'none';
        });
      }
      input.addEventListener('input', apply);
      apply();
    });
  }

  function setupSorters() {
    qsa(document, '[data-sort-select]').forEach(function (select) {
      var target = document.getElementById(select.getAttribute('data-sort-target'));
      if (!target) return;
      var original = qsa(target, '[data-filter-item]');
      function sortCards() {
        var mode = select.value;
        var items = original.slice().sort(function (a, b) {
          var ay = parseInt(a.getAttribute('data-year') || '0', 10);
          var by = parseInt(b.getAttribute('data-year') || '0', 10);
          var ar = parseInt(a.getAttribute('data-rank') || '0', 10);
          var br = parseInt(b.getAttribute('data-rank') || '0', 10);
          if (mode === 'year-asc') return ay - by;
          if (mode === 'rank-asc') return ar - br;
          if (mode === 'rank-desc') return br - ar;
          return by - ay;
        });
        items.forEach(function (item) { target.appendChild(item); });
      }
      select.addEventListener('change', sortCards);
      sortCards();
    });
  }

  function setupVideoPlayers() {
    qsa(document, 'video[data-hls], video[data-src]').forEach(function (video) {
      var hlsUrl = video.getAttribute('data-hls');
      var mp4Url = video.getAttribute('data-src');
      if (mp4Url && !video.getAttribute('src')) {
        video.src = mp4Url;
      }
      if (hlsUrl && window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
      } else if (hlsUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
      }
    });
  }

  function setupScrollReveal() {
    var items = qsa(document, '[data-reveal]');
    if (!('IntersectionObserver' in window) || !items.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    items.forEach(function (item) {
      item.style.opacity = '0';
      item.style.transform = 'translateY(14px)';
      item.style.transition = 'opacity 360ms ease, transform 360ms ease';
      observer.observe(item);
    });
  }

  function setupBackToTop() {
    var btn = qs(document, '[data-back-top]');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.style.opacity = window.scrollY > 450 ? '1' : '0';
      btn.style.pointerEvents = window.scrollY > 450 ? 'auto' : 'none';
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function init() {
    setActiveNav();
    setupMobileMenu();
    setupFilters();
    setupSorters();
    setupVideoPlayers();
    setupScrollReveal();
    setupBackToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
