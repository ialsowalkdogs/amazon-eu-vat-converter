/**
 * Load the userscript with a mocked location hostname.
 *
 * Because constants like IS_UK and SOURCE_VAT are computed once at module
 * load time, each call resets the module registry (via jest.resetModules in
 * jest.config.js) so a fresh require picks up the correct hostname.
 *
 * @param {string} hostname  e.g. "www.amazon.de"
 * @param {object} [opts]
 * @param {string} [opts.country]  Country code to pre-seed in localStorage,
 *                                 simulating a returning user's saved choice.
 * @returns {object} The exported functions from the userscript.
 */
function loadScript(hostname, { country } = {}) {
	localStorage.clear();
	if (country) localStorage.setItem("aev_country", country);

	// jsdom does not allow direct assignment of window.location, but the
	// delete-then-assign pattern is reliable across modern jest-environment-jsdom
	// versions.
	delete window.location;
	window.location = { hostname };

	return require("../amazon-eu-vat-converter.user.js");
}

module.exports = { loadScript };
