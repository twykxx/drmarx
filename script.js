const searchInput = document.getElementById('search');
const langSelect = document.getElementById('lang');
const clearSearchBtn = document.getElementById('clear-search');
const faqList = document.getElementById('faq-list');
const faqTitle = document.getElementById('faq-title');

const titles = {
	fr: "FAQ (Questions fréquemment posées)",
	de: "FAQ (Häufig gestellte Fragen)",
	en: "FAQ (Frequently Asked Questions)",
	lu: "FAQ (Froen)"
};

const placeholders = {
	fr: "Rechercher une question...",
	de: "Frage suchen...",
	en: "Search a question...",
	lu: "Fro sichen..."
};

const phoneButton = `
  <a href="tel:+35228892315" class="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full px-4 py-2 mt-2 inline-flex items-center hover:underline">
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.6a1 1 0 01.9.55l1.1 2.2a1 1 0 01-.1 1.1L9 9a11 11 0 005 5l2.1-1.5a1 1 0 011.1-.1l2.2 1.1a1 1 0 01.55.9V19a2 2 0 01-2 2h-1C9.4 21 3 14.6 3 7V5z"/>
    </svg>
    +352 28 89 23 15
  </a>
`;

const templateVars = {
	'{{PHONE}}': phoneButton
};

function applyVariables(text) {
	return Object.entries(templateVars).reduce((acc, [key, val]) => {
		return acc.replaceAll(key, val);
	}, text);
}

function updateTitle() {
	const lang = langSelect.value;
	faqTitle.textContent = titles[lang] || titles['en'];
	searchInput.placeholder = placeholders[lang] || placeholders['en'];
}

function escapeRegex(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text, search) {
	if (!search) return text;

	const tags = [];
	const protectedText = text.replace(/<[^>]*>/g, match => {
		tags.push(match);
		return `__TAG__${tags.length - 1}__`;
	});

	const safeSearch = escapeRegex(search);
	const highlighted = protectedText.replace(
		new RegExp(`(${safeSearch})`, 'gi'),
		'<mark>$1</mark>'
	);

	return highlighted.replace(/__TAG__(\d+)__/g, (_, i) => tags[i]);
}

function renderFAQs(faqs) {
	const lang = langSelect.value;
	const search = searchInput.value.toLowerCase();
	const shouldOpen = search.length > 0;
	faqList.innerHTML = '';

	const filtered = faqs.filter(faq => {
		const content = [
			faq.question[lang] || '',
			faq.answer[lang] || '',
			...Object.values(faq.question),
			...Object.values(faq.answer),
			...(faq.keywords || [])
		].join(' ').toLowerCase();
		return content.includes(search);
	});

	filtered
		// place les .special en dernier
		.sort((a, b) => (a.special ? 1 : 0) - (b.special ? 1 : 0))
		.forEach(faq => {
			const details = document.createElement('details');
			details.className = `p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow`;
			if (faq.special) {
				details.classList.add('special-faq');
			} else {
				details.classList.add('bg-white');
			}

			details.open = shouldOpen;

			const summary = document.createElement('summary');
			summary.className = "font-semibold cursor-pointer " + (faq.special ? 'text-white' : 'text-indigo-600 hover:text-indigo-800');
			summary.innerHTML = highlight(faq.question[lang], search);

			let answerRaw = applyVariables(faq.answer[lang]);

			const contentDiv = document.createElement('div');
			contentDiv.className = `mt-2 space-y-3 ${faq.special ? 'text-white' : 'text-gray-600'}`;

			let answerParagraphs = answerRaw
				.split(/\n\s*\n/)
				.map(paragraph => `<p>${highlight(paragraph.trim(), search)}</p>`)
				.join('');

			contentDiv.innerHTML = answerParagraphs;

			details.appendChild(summary);
			details.appendChild(contentDiv);
			faqList.appendChild(details);
		});
}

let faqs = [];

async function loadFAQs() {
	try {
		const response = await fetch('faqs.json');
		faqs = await response.json();
		renderFAQs(faqs);
	} catch (error) {
		faqList.innerHTML = "<p class='text-red-600'>Erreur de chargement des FAQ.</p>";
		console.error('Erreur lors du chargement des FAQs:', error);
	}
}

function debounce(fn, delay) {
	let timeout;
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), delay);
	};
}

const debouncedSearch = debounce(() => {
	renderFAQs(faqs);
	clearSearchBtn.classList.toggle('hidden', searchInput.value === '');
}, 200);

searchInput.addEventListener('input', debouncedSearch);

clearSearchBtn.addEventListener('click', () => {
	searchInput.value = '';
	clearSearchBtn.classList.add('hidden');
	renderFAQs(faqs);
});

langSelect.addEventListener('change', () => {
	updateTitle();
	renderFAQs(faqs);
});

loadFAQs();
updateTitle();

document.addEventListener('DOMContentLoaded', () => {
	// --- Pagination dots footer ---
	const container = document.getElementById('scroll-container');

	if (container) {
		let dotsContainer = document.createElement('div');
		dotsContainer.id = 'pagination-dots';
		dotsContainer.style.textAlign = 'center';
		dotsContainer.style.marginTop = '10px';
		container.parentNode.insertBefore(dotsContainer, container.nextSibling);

		function createDots() {
			dotsContainer.innerHTML = '';

			const visibleWidth = container.clientWidth;
			const totalScrollWidth = container.scrollWidth;

			const pages = Math.ceil(totalScrollWidth / visibleWidth);

			for (let i = 0; i < pages; i++) {
				const dot = document.createElement('div');
				dot.classList.add('dot');
				if (i === 0) dot.classList.add('active');
				dot.style.width = '10px';
				dot.style.height = '10px';
				dot.style.borderRadius = '50%';
				dot.style.backgroundColor = '#cbd5e1'; // gris clair
				dot.style.margin = '0 5px';
				dot.style.display = 'inline-block';
				dot.style.cursor = 'pointer';
				dot.style.transition = 'background-color 0.3s, width 0.3s, height 0.3s';

				dot.addEventListener('click', () => {
					container.scrollTo({
						left: i * visibleWidth,
						behavior: 'smooth'
					});
					setActiveDot(i);
				});

				dotsContainer.appendChild(dot);
			}
		}

		function setActiveDot(index) {
			const dots = Array.from(dotsContainer.children);
			dots.forEach((dot, i) => {
				const isActive = i === index;
				dot.classList.toggle('active', isActive);
				dot.style.backgroundColor = isActive ? '#3b82f6' : '#cbd5e1';
				dot.style.width = isActive ? '12px' : '10px';
				dot.style.height = isActive ? '12px' : '10px';
			});
		}

		function updateActiveDotOnScroll() {
			const scrollLeft = container.scrollLeft;
			const visibleWidth = container.clientWidth;
			const maxScrollLeft = container.scrollWidth - visibleWidth;
			const tolerance = 4;

			let currentPage;

			if (scrollLeft >= maxScrollLeft - tolerance) {
				// On est tout à droite, active le dernier dot
				currentPage = dotsContainer.children.length - 1;
			} else {
				// Sinon on prend la page à gauche la plus proche (floor)
				currentPage = Math.floor(scrollLeft / visibleWidth);
			}

			setActiveDot(currentPage);
		}

		createDots();
		updateActiveDotOnScroll();

		window.addEventListener('resize', () => {
			createDots();
			updateActiveDotOnScroll();
		});

		container.addEventListener('scroll', updateActiveDotOnScroll);

		if ('ResizeObserver' in window) {
			const observer = new ResizeObserver(() => {
				createDots();
				updateActiveDotOnScroll();
			});
			observer.observe(container);
		}
	}

	// --- Flèches verticales FAQ ---
	const scrollUp = document.getElementById('scroll-up');
	const scrollDown = document.getElementById('scroll-down');
	const mainScroll = document.querySelector('main');

	if (scrollUp && scrollDown && mainScroll) {
		function updateVerticalArrows() {
			const scrollTop = mainScroll.scrollTop;
			const scrollMax = mainScroll.scrollHeight - mainScroll.clientHeight;

			scrollUp.style.display = scrollTop > 0 ? 'block' : 'none';
			scrollDown.style.display = scrollTop < scrollMax - 1 ? 'block' : 'none';
		}

		scrollUp.addEventListener('click', () => {
			mainScroll.scrollBy({ top: -100, behavior: 'smooth' });
		});

		scrollDown.addEventListener('click', () => {
			mainScroll.scrollBy({ top: 100, behavior: 'smooth' });
		});

		mainScroll.addEventListener('scroll', updateVerticalArrows);
		updateVerticalArrows();
	}
});
