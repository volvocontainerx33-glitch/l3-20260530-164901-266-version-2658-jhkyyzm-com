(function () {
    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function initMenu() {
        var toggle = document.querySelector('[data-menu-toggle]');
        var panel = document.querySelector('[data-mobile-panel]');
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener('click', function () {
            panel.classList.toggle('is-open');
        });
    }

    function initHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        if (slides.length <= 1) {
            return;
        }
        var index = 0;
        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === index);
            });
        }
        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
            });
        });
        window.setInterval(function () {
            show(index + 1);
        }, 5200);
    }

    function normalized(value) {
        return (value || '').toString().trim().toLowerCase();
    }

    function initFilters() {
        var page = document.querySelector('[data-filter-page]');
        if (!page) {
            return;
        }
        var textInput = page.querySelector('[data-filter-text]');
        var yearSelect = page.querySelector('[data-filter-year]');
        var regionSelect = page.querySelector('[data-filter-region]');
        var typeSelect = page.querySelector('[data-filter-type]');
        var cards = Array.prototype.slice.call(page.querySelectorAll('.movie-card'));
        var params = new URLSearchParams(window.location.search);
        var q = params.get('q');
        if (q && textInput) {
            textInput.value = q;
        }
        function apply() {
            var text = normalized(textInput ? textInput.value : '');
            var year = normalized(yearSelect ? yearSelect.value : '');
            var region = normalized(regionSelect ? regionSelect.value : '');
            var type = normalized(typeSelect ? typeSelect.value : '');
            cards.forEach(function (card) {
                var haystack = normalized([
                    card.dataset.title,
                    card.dataset.year,
                    card.dataset.region,
                    card.dataset.type,
                    card.dataset.genre,
                    card.dataset.tags,
                    card.dataset.category,
                    card.textContent
                ].join(' '));
                var matched = true;
                if (text && haystack.indexOf(text) === -1) {
                    matched = false;
                }
                if (year && normalized(card.dataset.year) !== year) {
                    matched = false;
                }
                if (region && normalized(card.dataset.region) !== region) {
                    matched = false;
                }
                if (type && normalized(card.dataset.type) !== type) {
                    matched = false;
                }
                card.style.display = matched ? '' : 'none';
            });
        }
        [textInput, yearSelect, regionSelect, typeSelect].forEach(function (field) {
            if (field) {
                field.addEventListener('input', apply);
                field.addEventListener('change', apply);
            }
        });
        apply();
    }

    function initPlayer() {
        var stage = document.querySelector('.video-stage[data-video-src]');
        if (!stage) {
            return;
        }
        var video = stage.querySelector('video');
        var button = stage.querySelector('.play-overlay');
        var src = stage.getAttribute('data-video-src');
        var loaded = false;
        var hlsInstance = null;
        function attachSource() {
            if (loaded || !video || !src) {
                return;
            }
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: false
                });
                hlsInstance.loadSource(src);
                hlsInstance.attachMedia(video);
            } else {
                video.src = src;
            }
            loaded = true;
        }
        function start() {
            attachSource();
            if (!video) {
                return;
            }
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () {});
            }
            if (button) {
                button.classList.add('is-hidden');
            }
        }
        if (button) {
            button.addEventListener('click', start);
        }
        if (video) {
            video.addEventListener('play', function () {
                if (button) {
                    button.classList.add('is-hidden');
                }
            });
            video.addEventListener('pause', function () {
                if (button && video.currentTime === 0) {
                    button.classList.remove('is-hidden');
                }
            });
        }
        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }

    ready(function () {
        initMenu();
        initHero();
        initFilters();
        initPlayer();
    });
})();
