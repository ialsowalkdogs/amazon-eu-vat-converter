const { loadScript } = require("./helpers");

// Helpers ──────────────────────────────────────────────────────────────────

function setLanguages(langs) {
	Object.defineProperty(navigator, "languages", {
		get: () => langs,
		configurable: true,
	});
}

function setTimezone(tz) {
	jest.spyOn(Intl, "DateTimeFormat").mockImplementation(() => ({
		resolvedOptions: () => ({ timeZone: tz }),
	}));
}

// Tests ────────────────────────────────────────────────────────────────────

describe("detectCountry", () => {
	// ─── Language-based detection ──────────────────────────────────────────

	test("picks up explicit region subtag (fi-FI → FI)", () => {
		const { detectCountry } = loadScript("www.amazon.de");
		setLanguages(["fi-FI"]);
		expect(detectCountry()).toBe("FI");
	});

	test("picks up region subtag even when not the first preference (en-US, fi-FI → FI)", () => {
		const { detectCountry } = loadScript("www.amazon.de");
		setLanguages(["en-US", "fi-FI"]);
		expect(detectCountry()).toBe("FI");
	});

	test("falls back to bare language code when no region subtag (fi → FI)", () => {
		const { detectCountry } = loadScript("www.amazon.de");
		setLanguages(["fi"]);
		expect(detectCountry()).toBe("FI");
	});

	test("bare language code works as secondary preference (en, fi → FI)", () => {
		const { detectCountry } = loadScript("www.amazon.de");
		setLanguages(["en", "fi"]);
		expect(detectCountry()).toBe("FI");
	});

	test("bare 'de' language maps to Germany (de → DE)", () => {
		const { detectCountry } = loadScript("www.amazon.fr");
		setLanguages(["de"]);
		expect(detectCountry()).toBe("DE");
	});

	// ─── Timezone fallback ─────────────────────────────────────────────────
	// Triggered when navigator.languages contains only non-matching codes
	// (e.g. a fully-English browser with no secondary languages).

	test("falls back to timezone when languages give no match (en + Helsinki → FI)", () => {
		const { detectCountry } = loadScript("www.amazon.de");
		setLanguages(["en"]);
		setTimezone("Europe/Helsinki");
		expect(detectCountry()).toBe("FI");
	});

	test("falls back to timezone: Europe/Warsaw → PL", () => {
		const { detectCountry } = loadScript("www.amazon.de");
		setLanguages(["en"]);
		setTimezone("Europe/Warsaw");
		expect(detectCountry()).toBe("PL");
	});

	test("falls back to timezone: Europe/London → GB", () => {
		const { detectCountry } = loadScript("www.amazon.de");
		setLanguages(["en"]);
		setTimezone("Europe/London");
		expect(detectCountry()).toBe("GB");
	});

	// ─── Storefront fallback ───────────────────────────────────────────────

	test("falls back to storefront country when timezone is unknown (amazon.de)", () => {
		const { detectCountry } = loadScript("www.amazon.de");
		setLanguages(["en"]);
		setTimezone("America/New_York");
		expect(detectCountry()).toBe("DE");
	});

	test("falls back to storefront country when timezone is unknown (amazon.fr)", () => {
		const { detectCountry } = loadScript("www.amazon.fr");
		setLanguages(["en"]);
		setTimezone("America/New_York");
		expect(detectCountry()).toBe("FR");
	});

	// ─── localStorage preference ───────────────────────────────────────────

	test("loadCountry returns saved country over auto-detected one", () => {
		// localStorage = 'HU', but language 'de' would auto-detect to 'DE'
		const { loadCountry } = loadScript("www.amazon.de", { country: "HU" });
		setLanguages(["de"]);
		expect(loadCountry()).toBe("HU");
	});

	test("loadCountry falls back to detectCountry when localStorage is empty", () => {
		const { loadCountry } = loadScript("www.amazon.de"); // no country seed
		setLanguages(["fi-FI"]);
		// localStorage is empty, so detectCountry() is used → "FI"
		expect(loadCountry()).toBe("FI");
	});
});
