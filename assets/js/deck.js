// Arrow-key slide navigation, counter, progress bar, and #slide deep links.
(function () {
	var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
	var counter = document.querySelector('.counter');
	var progress = document.querySelector('.progress');
	var current = 0;

	function pad(n) { return n < 10 ? '0' + n : '' + n; }

	function setActive(i) {
		current = i;
		slides.forEach(function (s, j) { s.classList.toggle('is-active', j === i); });
		if (counter) counter.textContent = pad(i + 1) + ' / ' + pad(slides.length);
		if (progress) progress.style.width = ((i + 1) / slides.length * 100) + '%';
		var id = slides[i].id;
		if (id && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
	}

	function go(i) {
		i = Math.max(0, Math.min(slides.length - 1, i));
		slides[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
		setActive(i);
	}

	document.addEventListener('keydown', function (e) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		var t = e.target.tagName;
		if (t === 'INPUT' || t === 'TEXTAREA') return;
		switch (e.key) {
			case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
				e.preventDefault(); go(current + 1); break;
			case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
				e.preventDefault(); go(current - 1); break;
			case 'Home': e.preventDefault(); go(0); break;
			case 'End': e.preventDefault(); go(slides.length - 1); break;
		}
	});

	// Keep state in sync when scrolling with a trackpad or mouse.
	var io = new IntersectionObserver(function (entries) {
		entries.forEach(function (en) {
			if (en.isIntersecting) setActive(slides.indexOf(en.target));
		});
	}, { threshold: 0.55 });
	slides.forEach(function (s) { io.observe(s); });

	var start = location.hash ? slides.findIndex(function (s) { return '#' + s.id === location.hash; }) : 0;
	if (start > 0) slides[start].scrollIntoView();
	setActive(Math.max(0, start));
})();
