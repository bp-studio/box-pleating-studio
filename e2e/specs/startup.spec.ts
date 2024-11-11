import { expect, test } from "@playwright/test";

test.describe("JavaScript disabled", () => {
	test.use({ javaScriptEnabled: false });

	test("Shows JavaScript error message", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator(".noscript")).toBeVisible();
	});
});

test.describe("Network failure", () => {
	test("Shows resource error message", async ({ page }) => {
		// Simulate network error.
		await page.route(/vendor\.\w+\.js/, route => route.abort());
		await page.goto("/");
		const locator = page.locator("#resource");
		await expect(locator).toBeVisible();
		await expect(locator).toContainText("vendor");
	});

	test("Rsbuild asset retry plugin", async ({ page }) => {
		let retry = false;
		await page.route(/vendor\.\w+\.js/, route => {
			const url = new URL(route.request().url());
			if(!url.searchParams.has("retry")) {
				route.abort(); // Simulate network error only on the first attempt.
			} else {
				retry = true;
				route.continue();
			}
		});
		await page.goto("/");
		const menu = page.getByRole("menubar");
		await expect(menu).toBeInViewport();
		await expect(menu.getByRole("menuitem").first()).not.toBeDisabled();
		expect(retry).toBeTruthy();
	});
});
