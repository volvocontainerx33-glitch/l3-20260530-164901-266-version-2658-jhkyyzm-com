(function () {
    var menuButton = document.querySelector('[data-menu-button]');
    var nav = document.querySelector('[data-site-nav]');

    if (menuButton && nav) {
        menuButton.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    var slider = document.querySelector('[data-hero-slider]');
    if (slider) {
        var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
        var buttons = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-go]'));
        var active = 0;

        var show = function (index) {
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === active);
            });
            buttons.forEach(function (button, buttonIndex) {
                button.classList.toggle('is-active', buttonIndex === active);
            });
        };

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                show(Number(button.getAttribute('data-hero-go')) || 0);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function () {
                show(active + 1);
            }, 5200);
        }
    }

    var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-search-scope]'));
    var globalInput = document.querySelector('.quick-search-panel [data-search-input]');

    var filterCards = function (scope, query) {
        var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));
        var empty = scope.querySelector('[data-empty-state]');
        var normalized = query.trim().toLowerCase();
        var visible = 0;

        cards.forEach(function (card) {
            var haystack = [
                card.getAttribute('data-title'),
                card.getAttribute('data-year'),
                card.getAttribute('data-region'),
                card.getAttribute('data-tags')
            ].join(' ').toLowerCase();
            var matched = !normalized || haystack.indexOf(normalized) !== -1;
            card.style.display = matched ? '' : 'none';
            if (matched) {
                visible += 1;
            }
        });

        if (empty) {
            empty.style.display = visible === 0 ? 'block' : 'none';
        }
    };

    scopes.forEach(function (scope) {
        var input = scope.querySelector('[data-search-input]');
        if (input) {
            input.addEventListener('input', function () {
                filterCards(scope, input.value);
            });
        }
    });

    if (globalInput && scopes.length) {
        globalInput.addEventListener('input', function () {
            filterCards(scopes[0], globalInput.value);
        });
    }

    var forms = Array.prototype.slice.call(document.querySelectorAll('[data-search-form]'));
    forms.forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
        });
    });

    var loadVideo = function (video, url) {
        if (video.getAttribute('data-ready') === '1') {
            return Promise.resolve();
        }

        video.setAttribute('data-ready', '1');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            return Promise.resolve();
        }

        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            return new Promise(function (resolve) {
                hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    resolve();
                });
                window.setTimeout(resolve, 1200);
            });
        }

        video.src = url;
        return Promise.resolve();
    };

    var players = Array.prototype.slice.call(document.querySelectorAll('.player-card'));
    players.forEach(function (player) {
        var video = player.querySelector('video');
        var button = player.querySelector('[data-play-button]');
        if (!video || !button) {
            return;
        }

        var start = function () {
            var url = video.getAttribute('data-stream');
            if (!url) {
                return;
            }
            loadVideo(video, url).then(function () {
                button.classList.add('is-hidden');
                var action = video.play();
                if (action && typeof action.catch === 'function') {
                    action.catch(function () {});
                }
            });
        };

        button.addEventListener('click', start);
        video.addEventListener('click', function () {
            if (video.paused) {
                start();
            }
        });
        video.addEventListener('play', function () {
            button.classList.add('is-hidden');
        });
        video.addEventListener('pause', function () {
            if (!video.ended) {
                button.classList.remove('is-hidden');
            }
        });
    });
})();
