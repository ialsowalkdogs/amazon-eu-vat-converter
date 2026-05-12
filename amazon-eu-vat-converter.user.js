// ==UserScript==
// @name         Amazon EU VAT Converter
// @namespace    https://github.com/ialsowalkdogs/amazon-eu-vat-converter
// @version      1.0.0
// @description  See prices with your local VAT applied on any Amazon EU storefront
// @author       ialsowalkdogs
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
		{ code: "DE", name: "Germany", flag: "🇩🇪", vat: 19 },
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

	// Per-storefront metadata: home country code and currency symbol.
	// The VAT rate baked into storefront prices is derived from COUNTRIES above
	// via countryCode, so there is no need to maintain a separate numeric list.
	const STOREFRONTS = {
		"www.amazon.de": { countryCode: "DE", currency: "€" },
		"www.amazon.fr": { countryCode: "FR", currency: "€" },
		"www.amazon.it": { countryCode: "IT", currency: "€" },
		"www.amazon.es": { countryCode: "ES", currency: "€" },
		"www.amazon.co.uk": { countryCode: "GB", currency: "£" },
		"www.amazon.nl": { countryCode: "NL", currency: "€" },
		"www.amazon.pl": { countryCode: "PL", currency: "zł" },
		"www.amazon.se": { countryCode: "SE", currency: "kr" },
	};

	const _storefront = STOREFRONTS[location.hostname];
	const SOURCE_VAT =
		COUNTRIES.find((c) => c.code === _storefront?.countryCode)?.vat ?? 19;
	const SOURCE_CURRENCY = _storefront?.currency ?? "€";

	const STORAGE_KEY = "aev_country";

	// IANA timezone → country code for every country in COUNTRIES.
	// Used as a locale-independent fallback in detectCountry().
	const TIMEZONE_COUNTRIES = {
		"Europe/Vienna": "AT",
		"Europe/Brussels": "BE",
		"Europe/Sofia": "BG",
		"Europe/Zurich": "CH",
		"Asia/Nicosia": "CY",
		"Europe/Nicosia": "CY",
		"Europe/Prague": "CZ",
		"Europe/Berlin": "DE",
		"Europe/Copenhagen": "DK",
		"Europe/Tallinn": "EE",
		"Europe/Athens": "GR",
		"Europe/Madrid": "ES",
		"Europe/Helsinki": "FI",
		"Europe/Paris": "FR",
		"Europe/London": "GB",
		"Europe/Zagreb": "HR",
		"Europe/Budapest": "HU",
		"Europe/Dublin": "IE",
		"Atlantic/Reykjavik": "IS",
		"Europe/Rome": "IT",
		"Europe/Vilnius": "LT",
		"Europe/Luxembourg": "LU",
		"Europe/Riga": "LV",
		"Europe/Malta": "MT",
		"Europe/Amsterdam": "NL",
		"Europe/Oslo": "NO",
		"Europe/Warsaw": "PL",
		"Europe/Lisbon": "PT",
		"Atlantic/Azores": "PT",
		"Europe/Bucharest": "RO",
		"Europe/Stockholm": "SE",
		"Europe/Ljubljana": "SI",
		"Europe/Bratislava": "SK",
	};

	// ─────────────────────────────────────────────────────────────────────────
	// 2. STATE
	// ─────────────────────────────────────────────────────────────────────────

	function detectCountry() {
		// 1. Check every browser language preference, not just the primary one.
		//    A user with "en" as UI language may still list "fi" or "fi-FI" as a
		//    secondary preference (Settings → Languages).
		const langs = navigator.languages?.length
			? navigator.languages
			: [navigator.language || ""];
		for (const lang of langs) {
			const parts = lang.split("-");
			const code = (parts[1] || parts[0] || "").toUpperCase();
			if (COUNTRIES.find((c) => c.code === code)) return code;
		}
		// 2. Fall back to the system timezone — reliable even when the browser
		//    UI language gives no country signal (e.g. plain "en").
		const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const tzCode = TIMEZONE_COUNTRIES[tz];
		if (tzCode) return tzCode;
		// 3. Last resort: home country of the visited storefront.
		return STOREFRONTS[location.hostname]?.countryCode ?? "DE";
	}

	function loadCountry() {
		return localStorage.getItem(STORAGE_KEY) || detectCountry();
	}

	function saveCountry(code) {
		localStorage.setItem(STORAGE_KEY, code);
	}

	let selectedCode = loadCountry();

	function getSelected() {
		const fallbackCode = STOREFRONTS[location.hostname]?.countryCode ?? "DE";
		return (
			COUNTRIES.find((c) => c.code === selectedCode) ||
			COUNTRIES.find((c) => c.code === fallbackCode) ||
			COUNTRIES[0] // last-resort: list is never empty
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
	// 4. STYLES
	// ─────────────────────────────────────────────────────────────────────────

	const BADGE_CLASS = "aev-badge";

	function injectStyles() {
		const style = document.createElement("style");
		style.textContent = `
			.aev-badge {
				display: inline-block;
				font-size: 11px;
				line-height: 16px;
				background: #1a1a2e;
				color: #e0e0e0;
				padding: 2px 7px;
				border-radius: 3px;
				margin-left: 6px;
				vertical-align: middle;
				font-family: Arial, sans-serif;
				white-space: nowrap;
				cursor: default;
				box-shadow: 0 1px 3px rgba(0,0,0,.3);
			}
			#aev-widget {
				position: fixed;
				bottom: 20px;
				right: 20px;
				z-index: 999999;
				font-family: Arial, sans-serif;
				font-size: 13px;
				user-select: none;
			}
			#aev-pill {
				display: flex;
				align-items: center;
				gap: 5px;
				background: #1a1a2e;
				color: #e0e0e0;
				border: 1px solid #444;
				border-radius: 20px;
				padding: 5px 12px;
				cursor: pointer;
				font-size: 13px;
				box-shadow: 0 2px 6px rgba(0,0,0,.4);
				white-space: nowrap;
			}
			.aev-pill__chevron { opacity: .6; font-size: 11px; }
			#aev-panel {
				/* display toggled between none/flex by JS */
				display: none;
				position: absolute;
				bottom: calc(100% + 8px);
				right: 0;
				background: #1a1a2e;
				border: 1px solid #444;
				border-radius: 8px;
				padding: 8px;
				box-shadow: 0 4px 16px rgba(0,0,0,.5);
				min-width: 220px;
				max-height: 340px;
				overflow: hidden;
				flex-direction: column;
				gap: 4px;
			}
			#aev-search {
				background: #0d0d1a;
				border: 1px solid #555;
				border-radius: 4px;
				color: #e0e0e0;
				padding: 4px 8px;
				font-size: 12px;
				outline: none;
				margin-bottom: 4px;
			}
			#aev-list {
				overflow-y: auto;
				max-height: 260px;
				display: flex;
				flex-direction: column;
				gap: 1px;
			}
			.aev-row {
				display: flex;
				align-items: center;
				gap: 8px;
				background: transparent;
				color: #e0e0e0;
				border: none;
				border-radius: 4px;
				padding: 5px 8px;
				cursor: pointer;
				font-size: 12px;
				text-align: left;
				width: 100%;
			}
			.aev-row--selected { background: #2e2e4e; }
			.aev-row__name { flex: 1; }
			.aev-row__vat { opacity: .6; }
		`;
		document.head.appendChild(style);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// 5. DOM MANIPULATION
	// ─────────────────────────────────────────────────────────────────────────

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

		// Some price elements (e.g. discounted "priceToPay") ship with an empty
		// .a-offscreen span.  Fall back to the visible digit spans in that case.
		let priceText = offscreen.textContent.trim();
		if (!priceText) {
			const whole = priceEl.querySelector(".a-price-whole");
			const fraction = priceEl.querySelector(".a-price-fraction");
			if (whole && fraction) {
				// .a-price-whole contains a nested .a-price-decimal span; use only
				// the first text node so we get just the digits (e.g. "12").
				const wholeDigits = whole.childNodes[0]?.textContent?.trim() ?? "";
				priceText = `${wholeDigits}.${fraction.textContent.trim()}`;
			}
		}

		const sourcePrice = parsePrice(priceText);
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
	// 6. SETTINGS WIDGET
	// ─────────────────────────────────────────────────────────────────────────

	function buildWidget() {
		// --- Outer container (fixed to bottom-right) ---
		const widget = document.createElement("div");
		widget.id = "aev-widget";

		// --- Pill button ---
		const pill = document.createElement("button");
		pill.id = "aev-pill";
		pill.setAttribute("aria-haspopup", "listbox");
		pill.setAttribute("aria-expanded", "false");
		pill.setAttribute("aria-controls", "aev-panel");
		pill.setAttribute(
			"aria-label",
			"VAT converter: select destination country",
		);

		function refreshPill() {
			const c = getSelected();
			pill.innerHTML = `${c.flag} <strong>${c.code}</strong> ${c.vat}% <span class="aev-pill__chevron">▲</span>`;
		}
		refreshPill();

		// --- Dropdown panel ---
		const panel = document.createElement("div");
		panel.id = "aev-panel";
		panel.setAttribute("role", "listbox");
		panel.setAttribute("aria-label", "Destination country");

		// Search box
		const search = document.createElement("input");
		search.id = "aev-search";
		search.type = "text";
		search.placeholder = "Search country…";
		search.setAttribute("aria-label", "Search countries");
		search.setAttribute("aria-controls", "aev-list");
		search.setAttribute("autocomplete", "off");

		// Country list
		const list = document.createElement("div");
		list.id = "aev-list";

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
				row.className =
					"aev-row" + (c.code === selectedCode ? " aev-row--selected" : "");
				row.setAttribute("role", "option");
				row.setAttribute("aria-selected", String(c.code === selectedCode));
				row.innerHTML = `${c.flag} <span class="aev-row__name">${c.name}</span> <span class="aev-row__vat">${c.vat}%</span>`;
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
			pill.setAttribute("aria-expanded", "true");
			open = true;
			search.value = "";
			buildList("");
			// requestAnimationFrame waits for the panel to be painted before
			// focusing, avoiding the arbitrary 50 ms magic number.
			requestAnimationFrame(() => search.focus());
		}

		function closePanel() {
			panel.style.display = "none";
			pill.setAttribute("aria-expanded", "false");
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
	// 7. INIT
	// ─────────────────────────────────────────────────────────────────────────

	// Export pure functions for unit testing in Node.js / Jest.
	// The typeof guard is a no-op in browsers where `module` is undefined.
	if (typeof module !== "undefined") {
		module.exports = {
			parsePrice,
			formatPrice,
			convertPrice,
			detectCountry,
			loadCountry,
			addBadge,
		};
		return; // skip DOM side-effects in test environment
	}

	injectStyles();
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
