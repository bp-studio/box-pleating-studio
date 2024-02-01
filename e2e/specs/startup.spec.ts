import { expect, test } from "@playwright/test";

test.describe("JavaScript disabled", () => {
	test.use({ javaScriptEnabled: false });

	test("shows JavaScript error message", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator(".noscript")).toBeVisible();
	});
});

test.describe("Network failure", () => {
	test("Shows resource error message", async ({ page }) => {
		// Simulate network error.
		// For some reason, intercepting client.js doesn't work in webkit,
		// so we use bootstrap.min.js instead.
		await page.route("**/bootstrap.min.js", route => route.abort());
		await page.goto("/");
		const locator = page.locator("#resource");
		await expect(locator).toBeVisible();
		await expect(locator).toContainText("bootstrap.min.js");
	});
});
