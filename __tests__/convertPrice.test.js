const { loadScript } = require("./helpers");

// VAT conversion formula:  net = sourcePrice / (1 + sourceVat/100)
//                          out  = net * (1 + destVat/100)

describe("convertPrice", () => {
	test.each([
		// [hostname,        destCountry, input,  expected, note]
		["www.amazon.de",   "DE",  119,    119,    "DE→DE  (19%→19%) unchanged"],
		["www.amazon.de",   "FI",  119,    125.50, "DE→FI  (19%→25.5%) higher"],
		["www.amazon.de",   "HU",  119,    127,    "DE→HU  (19%→27%) higher"],
		["www.amazon.de",   "LU",  119,    117,    "DE→LU  (19%→17%) lower"],
		["www.amazon.de",   "CH",  119,    108.10, "DE→CH  (19%→8.1%) much lower"],
		["www.amazon.co.uk","GB",  120,    120,    "UK→GB  (20%→20%) unchanged"],
		["www.amazon.fr",   "DE",  120,    119,    "FR→DE  (20%→19%) slightly lower"],
		["www.amazon.se",   "FI",  125,    125.50, "SE→FI  (25%→25.5%) slightly higher"],
	])("%s %s: %d → ~%d  (%s)", (hostname, country, input, expected) => {
		const { convertPrice } = loadScript(hostname, { country });
		expect(convertPrice(input)).toBeCloseTo(expected, 5);
	});
});
