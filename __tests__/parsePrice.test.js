const { loadScript } = require("./helpers");

// All storefronts use US-style number format: comma = thousands separator,
// dot = decimal separator.

describe("parsePrice (amazon.de)", () => {
	let parsePrice;
	beforeEach(() => ({ parsePrice } = loadScript("www.amazon.de")));

	test.each([
		["€ 29.99",          29.99],
		["29.99 €",          29.99],
		["1,299.00 €",     1299.00],
		["1,234,567.89 €", 1234567.89], // multiple thousands separators
		["9.99",              9.99],    // no currency symbol
		["29.99 zł",         29.99],    // PLN
		["1,299.00 kr",    1299.00],    // SEK
	])('"%s" → %s', (input, expected) => {
		expect(parsePrice(input)).toBeCloseTo(expected, 5);
	});

	test.each([[""], ["N/A"], ["--"]])('"%s" → null', (input) => {
		expect(parsePrice(input)).toBeNull();
	});
});

describe("parsePrice (amazon.co.uk)", () => {
	let parsePrice;
	beforeEach(() => ({ parsePrice } = loadScript("www.amazon.co.uk")));

	test.each([
		["£19.99",          19.99],
		["£1,299.99",     1299.99],
		["£1,234,567.89", 1234567.89], // multiple thousands separators
		["9.99",             9.99],    // no currency symbol
	])('"%s" → %s', (input, expected) => {
		expect(parsePrice(input)).toBeCloseTo(expected, 5);
	});

	test.each([[""], ["N/A"]])('"%s" → null', (input) => {
		expect(parsePrice(input)).toBeNull();
	});

	test("dot followed by only 2 digits is treated as decimal point", () => {
		// "19.99" — dot before 2 digits — is never a thousands separator
		expect(parsePrice("19.99")).toBeCloseTo(19.99, 5);
	});
});
