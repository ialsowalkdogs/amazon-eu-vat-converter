const { loadScript } = require("./helpers");

describe("formatPrice", () => {
	// ─── European storefronts ────────────────────────────────────────────────
	// Comma decimal, currency symbol as suffix.

	test.each([
		["www.amazon.de", 29.99,  "29,99 €"],
		["www.amazon.de", 1299,   "1299,00 €"],
		["www.amazon.fr", 9.99,   "9,99 €"],
		["www.amazon.nl", 0.5,    "0,50 €"],
		["www.amazon.pl", 29.99,  "29,99 zł"],
		["www.amazon.se", 299.9,  "299,90 kr"],
	])("%s: %d → \"%s\"", (hostname, amount, expected) => {
		const { formatPrice } = loadScript(hostname);
		expect(formatPrice(amount)).toBe(expected);
	});

	// ─── British storefront ──────────────────────────────────────────────────
	// Dot decimal, £ prefix.

	test.each([
		[29.99,   "£29.99"],
		[1299,    "£1299.00"],
		[9.99,    "£9.99"],
		[0.5,     "£0.50"],
	])("amazon.co.uk: %d → \"%s\"", (amount, expected) => {
		const { formatPrice } = loadScript("www.amazon.co.uk");
		expect(formatPrice(amount)).toBe(expected);
	});

	// ─── Floating-point safety ───────────────────────────────────────────────

	test("rounds floating-point imprecision correctly (0.1 + 0.2)", () => {
		const { formatPrice } = loadScript("www.amazon.de");
		// 0.1 + 0.2 = 0.30000000000000004 in IEEE 754; toFixed(2) must round it
		expect(formatPrice(0.1 + 0.2)).toBe("0,30 €");
	});
});
