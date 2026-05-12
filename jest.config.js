/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: "jsdom",
	// Only treat files ending in .test.js as test suites (excludes helpers.js).
	testMatch: ["**/__tests__/**/*.test.js"],
	// Reset module registry before each test so constants derived from
	// location.hostname (IS_UK, SOURCE_VAT, …) are recomputed per-test.
	resetModules: true,
	// Clear call history and restore spied implementations between tests.
	clearMocks: true,
	restoreMocks: true,
};
