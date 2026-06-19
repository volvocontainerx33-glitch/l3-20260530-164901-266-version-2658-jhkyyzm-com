(function () {
    var body = document.body;
    var menu = document.querySelector(".menu-toggle");

    if (menu) {
        menu.addEventListener("click", function () {
            body.classList.toggle("nav-open");
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var current = 0;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
            slide.classList.toggle("is-active", i === current);
        });
        dots.forEach(function (dot, i) {
            dot.classList.toggle("is-active", i === current);
        });
    }

    dots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
            showSlide(index);
        });
    });

    if (slides.length > 1) {
        window.setInterval(function () {
            showSlide(current + 1);
        }, 5600);
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function bindFilter(root) {
        var input = root.querySelector("[data-filter-input]");
        var region = root.querySelector("[data-filter-region]");
        var type = root.querySelector("[data-filter-type]");
        var cards = Array.prototype.slice.call(root.querySelectorAll("[data-movie-card]"));
        var empty = root.querySelector(".search-empty");

        function apply() {
            var keyword = normalize(input ? input.value : "");
            var regionValue = region ? region.value : "all";
            var typeValue = type ? type.value : "all";
            var visible = 0;

            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute("data-title"),
                    card.getAttribute("data-tags"),
                    card.getAttribute("data-year"),
                    card.getAttribute("data-region"),
                    card.getAttribute("data-type")
                ].join(" "));
                var okKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                var okRegion = regionValue === "all" || card.getAttribute("data-region") === regionValue;
                var okType = typeValue === "all" || card.getAttribute("data-type") === typeValue;
                var ok = okKeyword && okRegion && okType;
                card.style.display = ok ? "" : "none";
                if (ok) {
                    visible += 1;
                }
            });

            if (empty) {
                empty.classList.toggle("is-visible", visible === 0);
            }
        }

        [input, region, type].forEach(function (node) {
            if (node) {
                node.addEventListener("input", apply);
                node.addEventListener("change", apply);
            }
        });
        apply();
    }

    Array.prototype.slice.call(document.querySelectorAll("[data-filter-root]")).forEach(bindFilter);

    var heroSearch = document.querySelector("[data-hero-search]");
    var heroButton = document.querySelector("[data-hero-search-button]");

    function goSearch() {
        var keyword = heroSearch ? heroSearch.value.trim() : "";
        if (keyword) {
            window.location.href = "./search.html?q=" + encodeURIComponent(keyword);
        } else {
            window.location.href = "./search.html";
        }
    }

    if (heroButton) {
        heroButton.addEventListener("click", goSearch);
    }
    if (heroSearch) {
        heroSearch.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                goSearch();
            }
        });
    }

    var params = new URLSearchParams(window.location.search);
    var q = params.get("q");
    if (q) {
        var pageSearch = document.querySelector("[data-filter-input]");
        if (pageSearch) {
            pageSearch.value = q;
            pageSearch.dispatchEvent(new Event("input"));
        }
    }
})();

function initMoviePlayer(source) {
    var video = document.getElementById("player-video");
    var overlay = document.querySelector(".player-overlay");
    var playButton = document.querySelector(".player-play");
    var ready = false;
    var hls = null;
    var requested = false;

    if (!video || !source) {
        return;
    }

    function setup() {
        if (ready) {
            return;
        }
        ready = true;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source;
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MEDIA_ATTACHED, function () {
                hls.loadSource(source);
            });
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                if (requested) {
                    video.play().catch(function () {});
                }
            });
            hls.on(window.Hls.Events.ERROR, function (event, data) {
                if (data && data.fatal && hls) {
                    if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        hls.destroy();
                    }
                }
            });
            return;
        }

        video.src = source;
    }

    function begin() {
        requested = true;
        setup();
        if (overlay) {
            overlay.classList.add("is-hidden");
        }
        video.play().catch(function () {});
    }

    if (playButton) {
        playButton.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            begin();
        });
    }

    if (overlay) {
        overlay.addEventListener("click", begin);
    }

    video.addEventListener("click", function () {
        if (video.paused) {
            begin();
        } else {
            video.pause();
        }
    });

    video.addEventListener("play", function () {
        if (overlay) {
            overlay.classList.add("is-hidden");
        }
    });
}
