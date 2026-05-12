// ==UserScript==
// @name         Amazon EU VAT Converter
// @namespace    https://github.com/ialsowalkdogs/amazon-eu-vat-converter
// @version      1.0.0
// @description  See prices with your local VAT applied on any Amazon EU storefront
// @author       Olga Vorozheykina
// @match        https://www.amazon.de/*
// @match        https://www.amazon.fr/*
// @match        https://www.amazon.it/*
// @match        https://www.amazon.es/*
// @match        https://www.amazon.co.uk/*
// @match        https://www.amazon.nl/*
// @match        https://www.amazon.pl/*
// @match        https://www.amazon.se/*
// @grant        none
// ==/UserScript==

(() => {
	// ─────────────────────────────────────────────────────────────────────────
	// 1. DATA
	// ─────────────────────────────────────────────────────────────────────────

	// Standard VAT rates per destination country (as of 2025).
	// Reduced rates (food, books, medicine…) are NOT modelled — see README.
	const COUNTRIES = [
		{ code: "AT", name: "Austria", flag: "🇦🇹", vat: 20 },
		{ code: "BE", name: "Belgium", flag: "🇧🇪", vat: 21 },
		{ code: "BG", name: "Bulgaria", flag: "🇧🇬", vat: 20 },
		{ code: "CH", name: "Switzerland", flag: "🇨🇭", vat: 8.1 },
		{ code: "CY", name: "Cyprus", flag: "🇨🇾", vat: 19 },
		{ code: "CZ", name: "Czechia", flag: "🇨🇿", vat: 21 },
		{ code: "DK", name: "Denmark", flag: "🇩🇰", vat: 25 },
		{ code: "EE", name: "Estonia", flag: "🇪🇪", vat: 22 },
		{ code: "GR", name: "Greece", flag: "🇬🇷", vat: 24 },
		{ code: "ES", name: "Spain", flag: "🇪🇸", vat: 21 },
		{ code: "FI", name: "Finland", flag: "🇫🇮", vat: 25.5 },
		{ code: "FR", name: "France", flag: "🇫🇷", vat: 20 },
		{ code: "GB", name: "United Kingdom", flag: "🇬🇧", vat: 20 },
		{ code: "HR", name: "Croatia", flag: "🇭🇷", vat: 25 },
		{ code: "HU", name: "Hungary", flag: "🇭🇺", vat: 27 },
		{ code: "IE", name: "Ireland", flag: "🇮🇪", vat: 23 },
		{ code: "IS", name: "Iceland", flag: "🇮🇸", vat: 24 },
		{ code: "IT", name: "Italy", flag: "🇮🇹", vat: 22 },
		{ code: "LT", name: "Lithuania", flag: "🇱🇹", vat: 21 },
		{ code: "LU", name: "Luxembourg", flag: "🇱🇺", vat: 17 },
		{ code: "LV", name: "Latvia", flag: "🇱🇻", vat: 21 },
		{ code: "MT", name: "Malta", flag: "🇲🇹", vat: 18 },
		{ code: "NL", name: "Netherlands", flag: "🇳🇱", vat: 21 },
		{ code: "NO", name: "Norway", flag: "🇳🇴", vat: 25 },
		{ code: "PL", name: "Poland", flag: "🇵🇱", vat: 23 },
		{ code: "PT", name: "Portugal", flag: "🇵🇹", vat: 23 },
		{ code: "RO", name: "Romania", flag: "🇷🇴", vat: 19 },
		{ code: "SE", name: "Sweden", flag: "🇸🇪", vat: 25 },
		{ code: "SI", name: "Slovenia", flag: "🇸🇮", vat: 22 },
		{ code: "SK", name: "Slovakia", flag: "🇸🇰", vat: 20 },
	];

	// VAT rate already baked into prices on each Amazon storefront.
	const SOURCE_VATS = {
		"www.amazon.de": 19,
		"www.amazon.fr": 20,
		"www.amazon.it": 22,
		"www.amazon.es": 21,
		"www.amazon.co.uk": 20,
		"www.amazon.nl": 21,
		"www.amazon.pl": 23,
		"www.amazon.se": 25,
	};

	const SOURCE_VAT = SOURCE_VATS[location.hostname] ?? 19;

	// Home country code for each storefront — used as the locale fallback.
	const STOREFRONT_COUNTRIES = {
		"www.amazon.de": "DE",
		"www.amazon.fr": "FR",
		"www.amazon.it": "IT",
		"www.amazon.es": "ES",
		"www.amazon.co.uk": "GB",
		"www.amazon.nl": "NL",
		"www.amazon.pl": "PL",
		"www.amazon.se": "SE",
	};

	// Currency symbol used by each storefront.
	const SOURCE_CURRENCIES = {
		"www.amazon.de": "€",
		"www.amazon.fr": "€",
		"www.amazon.it": "€",
		"www.amazon.es": "€",
		"www.amazon.co.uk": "£",
		"www.amazon.nl": "€",
		"www.amazon.pl": "zł",
		"www.amazon.se": "kr",
	};
	const SOURCE_CURRENCY = SOURCE_CURRENCIES[location.hostname] ?? "€";

	const STORAGE_KEY = "aev_country";

	// ─────────────────────────────────────────────────────────────────────────
	// 2. STATE
	// ─────────────────────────────────────────────────────────────────────────

	function detectCountry() {
		// Try to infer from browser locale (e.g. "fi-FI" → "FI", "en-GB" → "GB").
		// A bare language tag like "en" or "de" won't have a region subtag and
		// therefore won't match a country code, so we fall back to the home
		// country of the storefront being visited rather than a hardcoded value.
		const lang = navigator.language || "";
		const parts = lang.split("-");
		const code = (parts[1] || "").toUpperCase();
		if (COUNTRIES.find((c) => c.code === code)) return code;
		return STOREFRONT_COUNTRIES[location.hostname] ?? "DE";
	}

	function loadCountry() {
		return localStorage.getItem(STORAGE_KEY) || detectCountry();
	}

	function saveCountry(code) {
		localStorage.setItem(STORAGE_KEY, code);
	}

	let selectedCode = loadCountry();

	function getSelected() {
		const fallbackCode = STOREFRONT_COUNTRIES[location.hostname] ?? "DE";
		return (
			COUNTRIES.find((c) => c.code === selectedCode) ||
			COUNTRIES.find((c) => c.code === fallbackCode)
		);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// 3. PRICE LOGIC
	// ─────────────────────────────────────────────────────────────────────────

	// amazon.co.uk uses British format: comma = thousands sep, dot = decimal.
	// All other supported storefronts use European format: dot = thousands sep,
	// comma = decimal.
	const IS_UK = location.hostname === "www.amazon.co.uk";

	function parsePrice(text) {
		// Strip all currency symbols and whitespace, leaving only digits and separators.
		const stripped = text.replace(/[^\d.,]/g, "");
		let normalised;
		if (IS_UK) {
			// "1,299.99" → remove comma thousands separators → "1299.99"
			normalised = stripped.replace(/,(?=\d{3}(?:[,.]|$))/g, "");
		} else {
			// "1.299,99" → remove dot thousands separators → "1299,99" → "1299.99"
			normalised = stripped
				.replace(/\.(?=\d{3}(?:[,.]|$))/g, "") // remove thousands-sep dots
				.replace(",", "."); // decimal comma → dot (only the first one)
		}
		const value = parseFloat(normalised);
		return Number.isNaN(value) ? null : value;
	}

	function formatPrice(amount) {
		if (IS_UK) {
			// British format: dot decimal, currency symbol prefix
			return `${SOURCE_CURRENCY}${amount.toFixed(2)}`;
		}
		// European format: comma decimal, currency symbol suffix
		return `${amount.toFixed(2).replace(".", ",")} ${SOURCE_CURRENCY}`;
	}

	function convertPrice(sourcePrice) {
		const country = getSelected();
		const net = sourcePrice / (1 + SOURCE_VAT / 100);
		return net * (1 + country.vat / 100);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// 4. DOM MANIPULATION
	// ─────────────────────────────────────────────────────────────────────────

	const BADGE_CLASS = "aev-badge";

	function removeAllBadges() {
		document.querySelectorAll(`.${BADGE_CLASS}`).forEach((b) => {
			b.remove();
		});
		document.querySelectorAll("[data-aev-done]").forEach((el) => {
			delete el.dataset.aevDone;
		});
	}

	function addBadge(priceEl) {
		if (priceEl.dataset.aevDone) return;

		const offscreen = priceEl.querySelector(".a-offscreen");
		if (!offscreen) return;

		const sourcePrice = parsePrice(offscreen.textContent);
		if (!sourcePrice || sourcePrice <= 0) return;

		const country = getSelected();
		const localPrice = convertPrice(sourcePrice);
		const net = sourcePrice / (1 + SOURCE_VAT / 100);

		const badge = document.createElement("span");
		badge.className = BADGE_CLASS;
		badge.title = [
			`Store price (${SOURCE_VAT}% VAT): ${formatPrice(sourcePrice)}`,
			`Net (ex-VAT): ${formatPrice(net)}`,
			`Your price (${country.name}, ${country.vat}% VAT): ${formatPrice(localPrice)}`,
		].join("\n");
		badge.style.cssText = [
			"display:inline-block",
			"font-size:11px",
			"line-height:16px",
			"background:#1a1a2e",
			"color:#e0e0e0",
			"padding:2px 7px",
			"border-radius:3px",
			"margin-left:6px",
			"vertical-align:middle",
			"font-family:Arial,sans-serif",
			"white-space:nowrap",
			"cursor:default",
			"box-shadow:0 1px 3px rgba(0,0,0,.3)",
		].join(";");
		badge.textContent = `${country.flag} ${formatPrice(localPrice)}`;

		priceEl.insertAdjacentElement("afterend", badge);
		priceEl.dataset.aevDone = "1";
	}

	function processPage() {
		document
			.querySelectorAll(".a-price:not([data-aev-done])")
			.forEach(addBadge);
	}

	function reprocess() {
		removeAllBadges();
		processPage();
	}

	// ─────────────────────────────────────────────────────────────────────────
	// 5. SETTINGS WIDGET
	// ─────────────────────────────────────────────────────────────────────────

	function buildWidget() {
		// --- Outer container (fixed to bottom-right) ---
		const widget = document.createElement("div");
		widget.id = "aev-widget";
		widget.style.cssText = [
			"position:fixed",
			"bottom:20px",
			"right:20px",
			"z-index:999999",
			"font-family:Arial,sans-serif",
			"font-size:13px",
			"user-select:none",
		].join(";");

		// --- Pill button ---
		const pill = document.createElement("button");
		pill.id = "aev-pill";
		pill.style.cssText = [
			"display:flex",
			"align-items:center",
			"gap:5px",
			"background:#1a1a2e",
			"color:#e0e0e0",
			"border:1px solid #444",
			"border-radius:20px",
			"padding:5px 12px",
			"cursor:pointer",
			"font-size:13px",
			"box-shadow:0 2px 6px rgba(0,0,0,.4)",
			"white-space:nowrap",
		].join(";");

		function refreshPill() {
			const c = getSelected();
			pill.innerHTML = `${c.flag} <strong>${c.code}</strong> ${c.vat}% <span style="opacity:.6;font-size:11px">▲</span>`;
		}
		refreshPill();

		// --- Dropdown panel ---
		const panel = document.createElement("div");
		panel.id = "aev-panel";
		panel.style.cssText = [
			"display:none",
			"position:absolute",
			"bottom:calc(100% + 8px)",
			"right:0",
			"background:#1a1a2e",
			"border:1px solid #444",
			"border-radius:8px",
			"padding:8px",
			"box-shadow:0 4px 16px rgba(0,0,0,.5)",
			"min-width:220px",
			"max-height:340px",
			"overflow:hidden",
			"flex-direction:column",
			"gap:4px",
		].join(";");

		// Search box
		const search = document.createElement("input");
		search.type = "text";
		search.placeholder = "Search country…";
		search.style.cssText = [
			"background:#0d0d1a",
			"border:1px solid #555",
			"border-radius:4px",
			"color:#e0e0e0",
			"padding:4px 8px",
			"font-size:12px",
			"outline:none",
			"margin-bottom:4px",
		].join(";");

		// Country list
		const list = document.createElement("div");
		list.style.cssText = [
			"overflow-y:auto",
			"max-height:260px",
			"display:flex",
			"flex-direction:column",
			"gap:1px",
		].join(";");

		function buildList(filter) {
			list.innerHTML = "";
			const filtered = filter
				? COUNTRIES.filter(
						(c) =>
							c.name.toLowerCase().includes(filter) ||
							c.code.toLowerCase().includes(filter),
					)
				: COUNTRIES;

			filtered.forEach((c) => {
				const row = document.createElement("button");
				row.style.cssText = [
					"display:flex",
					"align-items:center",
					"gap:8px",
					`background:${c.code === selectedCode ? "#2e2e4e" : "transparent"}`,
					"color:#e0e0e0",
					"border:none",
					"border-radius:4px",
					"padding:5px 8px",
					"cursor:pointer",
					"font-size:12px",
					"text-align:left",
					"width:100%",
				].join(";");
				row.innerHTML = `${c.flag} <span style="flex:1">${c.name}</span> <span style="opacity:.6">${c.vat}%</span>`;
				row.addEventListener("click", () => {
					selectedCode = c.code;
					saveCountry(c.code);
					refreshPill();
					reprocess();
					closePanel();
				});
				list.appendChild(row);
			});
		}

		search.addEventListener("input", () =>
			buildList(search.value.toLowerCase().trim()),
		);
		buildList("");

		panel.appendChild(search);
		panel.appendChild(list);

		// Toggle open/close
		let open = false;

		function openPanel() {
			panel.style.display = "flex";
			open = true;
			search.value = "";
			buildList("");
			setTimeout(() => search.focus(), 50);
		}

		function closePanel() {
			panel.style.display = "none";
			open = false;
		}

		pill.addEventListener("click", (e) => {
			e.stopPropagation();
			open ? closePanel() : openPanel();
		});

		document.addEventListener("click", (e) => {
			if (open && !widget.contains(e.target)) closePanel();
		});

		widget.appendChild(panel);
		widget.appendChild(pill);
		document.body.appendChild(widget);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// 6. INIT
	// ─────────────────────────────────────────────────────────────────────────

	processPage();
	buildWidget();

	// Watch for dynamically injected prices (infinite scroll, carousels, etc.).
	// Debounced so that bursts of DOM mutations (e.g. lazy-loaded images, ads)
	// only trigger a single processPage() call ~200 ms after activity settles.
	let mutationTimer;
	const observer = new MutationObserver(() => {
		clearTimeout(mutationTimer);
		mutationTimer = setTimeout(processPage, 200);
	});
	observer.observe(document.body, { childList: true, subtree: true });
})();
