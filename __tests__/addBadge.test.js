const { loadScript } = require("./helpers");

// Builds a .a-price element that mirrors what Amazon renders for a discounted
// "priceToPay" price: the .a-offscreen span is empty (just whitespace) and the
// actual value is only available in the visible .a-price-whole / .a-price-fraction
// digit spans.
function makeDiscountedPriceEl(whole, fraction) {
	const el = document.createElement("span");
	el.className = "a-price";
	el.innerHTML = `
		<span class="a-offscreen"> </span>
		<span aria-hidden="true">
			<span class="a-price-symbol">€</span>
			<span class="a-price-whole">${whole}<span class="a-price-decimal">.</span></span>
			<span class="a-price-fraction">${fraction}</span>
		</span>`;
	return el;
}

// Builds a .a-price element where .a-offscreen is populated — the normal case
// used by non-discounted prices and the struck-through original price.
function makeRegularPriceEl(offscreenText) {
	const el = document.createElement("span");
	el.className = "a-price";
	el.innerHTML = `<span class="a-offscreen">${offscreenText}</span>`;
	return el;
}

describe("addBadge – discounted price with empty .a-offscreen", () => {
	let addBadge;

	beforeEach(() => {
		document.body.innerHTML = "";
		({ addBadge } = loadScript("www.amazon.de", { country: "DE" }));
	});

	test("inserts a badge when .a-offscreen is empty but digit spans are present", () => {
		const priceEl = makeDiscountedPriceEl("12", "65");
		document.body.appendChild(priceEl);

		addBadge(priceEl);

		// A badge must have been inserted immediately after the price element.
		const badge = priceEl.nextElementSibling;
		expect(badge).not.toBeNull();
		expect(badge.classList.contains("aev-badge")).toBe(true);
	});

	test("badge shows the VAT-converted amount derived from the discounted price", () => {
		// DE storefront (19% VAT) → DE destination (19% VAT): price is unchanged.
		const priceEl = makeDiscountedPriceEl("12", "65");
		document.body.appendChild(priceEl);

		addBadge(priceEl);

		expect(priceEl.nextElementSibling.textContent).toContain("12,65");
	});

	test("marks the element so a second call does not insert a duplicate badge", () => {
		const priceEl = makeDiscountedPriceEl("12", "65");
		document.body.appendChild(priceEl);

		addBadge(priceEl);
		addBadge(priceEl);

		const badges = document.querySelectorAll(".aev-badge");
		expect(badges).toHaveLength(1);
	});

	test("does not insert a badge when both .a-offscreen and digit spans are absent", () => {
		// Pathological element: has .a-offscreen but no digit spans and no text.
		const priceEl = makeRegularPriceEl(" ");
		document.body.appendChild(priceEl);

		addBadge(priceEl);

		expect(document.querySelector(".aev-badge")).toBeNull();
	});
});

describe("addBadge – regular (non-discounted) price", () => {
	let addBadge;

	beforeEach(() => {
		document.body.innerHTML = "";
		({ addBadge } = loadScript("www.amazon.de", { country: "DE" }));
	});

	test("inserts a badge when .a-offscreen contains the price", () => {
		// Normal non-discounted price: .a-offscreen is populated.
		const priceEl = makeRegularPriceEl("€29,99");
		document.body.appendChild(priceEl);

		addBadge(priceEl);

		const badge = priceEl.nextElementSibling;
		expect(badge).not.toBeNull();
		expect(badge.classList.contains("aev-badge")).toBe(true);
		expect(badge.textContent).toContain("29,99");
	});
});
