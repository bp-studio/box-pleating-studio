import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: "./e2e",
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: Boolean(process.env.CI),
	/* Retry once on failure */
	retries: 1,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: "list",
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: "http://localhost:30785",

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			testIgnore: /mobileChrome/,
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
			testIgnore: /mobileChrome/,
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"], userAgent: "Playwright" },
			testIgnore: /mobileChrome/,
		},

		/* Test against mobiles. */
		{
			name: "Mobile Chrome",
			use: { ...devices["Galaxy S5"] },
			testMatch: /mobileChrome/,
		},
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		command: "pnpm rsbuild preview --port 30785",
		url: "http://localhost:30785",
		reuseExistingServer: !process.env.CI,
	},
});
