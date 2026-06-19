(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function initMenu() {
    var button = document.querySelector(".menu-toggle");
    var nav = document.getElementById("mobileNav");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      var opened = nav.classList.toggle("is-open");
      button.setAttribute("aria-expanded", opened ? "true" : "false");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, itemIndex) {
        slide.classList.toggle("is-active", itemIndex === current);
      });
      dots.forEach(function (dot, itemIndex) {
        dot.classList.toggle("is-active", itemIndex === current);
      });
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        play();
      });
    });

    hero.addEventListener("mouseenter", function () {
      clearInterval(timer);
    });

    hero.addEventListener("mouseleave", play);
    show(0);
    play();
  }

  function createCard(movie) {
    var title = escapeHtml(movie.title);
    var meta = [movie.region, movie.type, movie.year, movie.genre].filter(Boolean).join(" · ");
    var cover = "./" + movie.coverIndex + ".jpg";
    return [
      '<a class="movie-card" href="./' + movie.file + '">',
      '  <figure class="movie-cover">',
      '    <img src="' + cover + '" alt="' + title + '" loading="lazy">',
      '    <span class="cover-badge">' + escapeHtml(movie.category) + '</span>',
      '    <span class="cover-play">播放</span>',
      '  </figure>',
      '  <div class="movie-card-body">',
      '    <p class="movie-meta">' + escapeHtml(meta) + '</p>',
      '    <h3>' + title + '</h3>',
      '    <p>' + escapeHtml(trimText(movie.oneLine || movie.summary || "", 72)) + '</p>',
      '    <div class="card-foot"><span>' + escapeHtml(movie.duration) + '</span><span>' + movie.rating.toFixed(1) + '</span></div>',
      '  </div>',
      '</a>'
    ].join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function trimText(value, limit) {
    var text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= limit) {
      return text;
    }
    return text.slice(0, limit).replace(/[，。；、,;\s]+$/, "") + "…";
  }

  function initSearchPage() {
    var input = document.getElementById("searchInput");
    var form = document.querySelector("[data-search-page-form]");
    var results = document.getElementById("searchResults");
    var title = document.getElementById("searchTitle");
    if (!input || !form || !results || !title || !window.MOVIES) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    input.value = query;

    function render(value) {
      var keyword = String(value || "").trim().toLowerCase();
      if (!keyword) {
        title.textContent = "推荐影片";
        results.innerHTML = window.MOVIES.slice(0, 48).map(createCard).join("");
        return;
      }
      var matched = window.MOVIES.filter(function (movie) {
        return [
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.category,
          movie.tags,
          movie.oneLine,
          movie.summary
        ].join(" ").toLowerCase().indexOf(keyword) !== -1;
      });
      title.textContent = "搜索结果";
      if (!matched.length) {
        results.innerHTML = '<div class="content-card"><h2>未找到相关影片</h2><p>可以尝试更换影片名、地区、年份或题材关键词。</p></div>';
        return;
      }
      results.innerHTML = matched.slice(0, 240).map(createCard).join("");
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = input.value.trim();
      var url = value ? "./search.html?q=" + encodeURIComponent(value) : "./search.html";
      window.history.replaceState(null, "", url);
      render(value);
    });

    input.addEventListener("input", function () {
      render(input.value);
    });

    render(query);
  }

  ready(function () {
    initMenu();
    initHero();
    initSearchPage();
  });

  window.setupVideoPlayer = function (streamUrl) {
    var video = document.getElementById("movieVideo");
    var overlay = document.getElementById("playOverlay");
    if (!video || !overlay || !streamUrl) {
      return;
    }

    function attach() {
      if (video.getAttribute("data-ready") === "1") {
        return;
      }
      video.setAttribute("data-ready", "1");
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        video.hlsInstance = hls;
      } else {
        video.src = streamUrl;
      }
    }

    function start() {
      attach();
      overlay.classList.add("is-hidden");
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {
          overlay.classList.remove("is-hidden");
        });
      }
    }

    overlay.addEventListener("click", start);
    video.addEventListener("click", function () {
      if (video.paused) {
        start();
      }
    });
    video.addEventListener("play", function () {
      overlay.classList.add("is-hidden");
    });
    video.addEventListener("pause", function () {
      if (!video.ended) {
        overlay.classList.remove("is-hidden");
      }
    });
  };
})();
