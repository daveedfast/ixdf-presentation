// Slide navigation: arrow keys page through long answers before moving on,
// plus counter, progress bar, and #slide deep links.
(function () {
	var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
	var counter = document.querySelector('.counter');
	var progress = document.querySelector('.progress');
	var current = -1;
	var EDGE = 4; // px tolerance for "already at the edge"

	function pad(n) { return n < 10 ? '0' + n : '' + n; }

	function setActive(i) {
		if (i === current) return;
		current = i;
		slides.forEach(function (s, j) { s.classList.toggle('is-active', j === i); });
		if (counter) counter.textContent = pad(i + 1) + ' / ' + pad(slides.length);
		if (progress) progress.style.width = ((i + 1) / slides.length * 100) + '%';
		var id = slides[i].id;
		if (id && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
	}

	// Active slide = the last one whose top has passed 40% of the viewport.
	function activeFromScroll() {
		var line = window.innerHeight * 0.4, idx = 0;
		slides.forEach(function (s, j) { if (s.getBoundingClientRect().top <= line) idx = j; });
		return idx;
	}

	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	function scrollToY(y) { window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' }); }
	function slideTop(i) { return slides[i].getBoundingClientRect().top + window.scrollY; }

	function next() {
		var i = activeFromScroll(), r = slides[i].getBoundingClientRect(), vh = window.innerHeight;
		// Long answer still has content below the fold: page down within it.
		if (r.bottom > vh + EDGE) {
			scrollToY(window.scrollY + Math.min(vh * 0.85, r.bottom - vh));
		} else if (i < slides.length - 1) {
			scrollToY(slideTop(i + 1));
		}
	}

	function prev() {
		var i = activeFromScroll(), r = slides[i].getBoundingClientRect(), vh = window.innerHeight;
		// Scrolled into a long answer: page back up within it first.
		if (r.top < -EDGE) {
			scrollToY(window.scrollY - Math.min(vh * 0.85, -r.top));
		} else if (i > 0) {
			var p = slides[i - 1];
			// Land at the end of a long previous answer, or the top of a short one.
			scrollToY(slideTop(i - 1) + Math.max(0, p.offsetHeight - vh));
		}
	}

	document.addEventListener('keydown', function (e) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		var t = e.target.tagName;
		if (t === 'INPUT' || t === 'TEXTAREA') return;
		// Space should open a focused framework row or press a focused control, not change slides.
		if (e.key === ' ' && (t === 'SUMMARY' || t === 'BUTTON' || t === 'A')) return;
		switch (e.key) {
			case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
				e.preventDefault(); next(); break;
			case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
				e.preventDefault(); prev(); break;
			case 'Home': e.preventDefault(); scrollToY(0); break;
			case 'End': e.preventDefault(); scrollToY(slideTop(slides.length - 1)); break;
		}
	});

	// In-page links (e.g. the cover's scroll-down arrow) scroll smoothly to their slide.
	document.addEventListener('click', function (e) {
		var a = e.target.closest('a[href^="#"]');
		if (!a) return;
		var target = document.getElementById(a.getAttribute('href').slice(1));
		if (!target) return;
		e.preventDefault();
		scrollToY(target.getBoundingClientRect().top + window.scrollY);
	});

	var ticking = false;
	window.addEventListener('scroll', function () {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(function () { setActive(activeFromScroll()); ticking = false; });
	}, { passive: true });
	window.addEventListener('resize', function () { setActive(activeFromScroll()); });

	// Let #slide links decide the starting position, not the browser's remembered scroll.
	if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

	var start = location.hash ? slides.findIndex(function (s) { return '#' + s.id === location.hash; }) : 0;
	if (start > 0) slides[start].scrollIntoView();
	setActive(start > 0 ? start : activeFromScroll());

	// Web fonts and images can shift layout after load; keep a linked slide in place
	// until the viewer starts navigating.
	if (start > 0) {
		var userMoved = false;
		['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
			window.addEventListener(ev, function () { userMoved = true; }, { once: true, passive: true });
		});
		var realign = function () { if (!userMoved) { slides[start].scrollIntoView(); setActive(start); } };
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(realign);
		window.addEventListener('load', realign);
		if ('ResizeObserver' in window) {
			var ro = new ResizeObserver(realign);
			ro.observe(document.body);
			setTimeout(function () { ro.disconnect(); }, 5000);
		}
	}
})();
