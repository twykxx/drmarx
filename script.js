const searchInput = document.getElementById('search');
const langSelect = document.getElementById('lang');
const clearSearchBtn = document.getElementById('clear-search');
const faqList = document.getElementById('faq-list');
const faqTitle = document.getElementById('faq-title');
const footerText = document.getElementById('footer-text');

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

const footerMessages = {
	fr: ["Une autre question ?", "Contactez notre secrétariat au"],
	de: ["Haben Sie eine weitere Frage?", "Kontaktieren Sie unser Sekretariat unter"],
	en: ["Have another question?", "Contact our secretariat at"],
	lu: ["Hutt Dir eng aner Fro ?", "Kontaktéiert eise Sekretariat um"]
};

const phoneButton = `
  <a href="tel:+35228892315" class="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full px-4 py-2 mt-2 inline-flex items-center hover:underline">
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.6a1 1 0 01.9.55l1.1 2.2a1 1 0 01-.1 1.1L9 9a11 11 0 005 5l2.1-1.5a1 1 0 011.1-.1l2.2 1.1a1 1 0 01.55.9V19a2 2 0 01-2 2h-1C9.4 21 3 14.6 3 7V5z"/>
    </svg>
    +352 28 89 23 15
  </a>
`;


function updateTitle() {
	const lang = langSelect.value;
	faqTitle.textContent = titles[lang] || titles['en'];
	searchInput.placeholder = placeholders[lang] || placeholders['en'];
}

function highlight(text, search) {
	if (!search) return text;
	
	// Temp : protèger les balises HTML
	const tags = [];
	const protectedText = text.replace(/<[^>]*>/g, match => {
		tags.push(match);
		return `__TAG__${tags.length - 1}__`;
	});

	// Appliquer le highlight sur le texte brut
	const highlighted = protectedText.replace(
		new RegExp(`(${search})`, 'gi'),
		'<mark>$1</mark>'
	);

	// Réinsérer les balises
	return highlighted.replace(/__TAG__(\d+)__/g, (_, i) => tags[i]);
}


function updateFooter() {
	const lang = langSelect.value;
	const [line1, line2] = footerMessages[lang] || footerMessages['en'];
	document.getElementById('footer-line-1').textContent = line1;
	document.getElementById('footer-line-2').textContent = line2;
	document.getElementById('footer-phone').innerHTML = phoneButton;
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

	filtered.forEach(faq => {
		const details = document.createElement('details');
		details.className = "bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow";
		details.open = shouldOpen;

		const summary = document.createElement('summary');
		summary.className = "font-semibold cursor-pointer text-indigo-600 hover:text-indigo-800";
		summary.innerHTML = highlight(faq.question[lang], search);

		let answerRaw = faq.answer[lang].replace('{{PHONE}}', phoneButton);

		const contentDiv = document.createElement('div');
		contentDiv.className = "mt-2 text-gray-600 space-y-3";

		// Séparer les paragraphes par double saut de ligne
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

searchInput.addEventListener('input', () => {
  renderFAQs(faqs);
  clearSearchBtn.classList.toggle('hidden', searchInput.value === '');
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  renderFAQs(faqs);
});

langSelect.addEventListener('change', () => {
	updateTitle();
	renderFAQs(faqs);
	updateFooter();
});

loadFAQs();
updateTitle();
updateFooter();
