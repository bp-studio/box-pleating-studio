import { expect, test } from "@playwright/test";

import { StudioPage } from "../utils/studioPage";

test.describe("JavaScript disabled", () => {
	test.use({ javaScriptEnabled: false });

	test("Shows JavaScript error message", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator(".noscript")).toBeVisible();
	});
});

test.describe("GPU disabled", () => {
	test("Shows WebGL error message", async ({ page }) => {
		// Simulate a browser in which the GPU is disabled,
		// so that neither WebGPU nor WebGL is available.
		await page.addInitScript(() => {
			delete (Navigator.prototype as { gpu?: unknown }).gpu;
			const getContext = HTMLCanvasElement.prototype.getContext;
			HTMLCanvasElement.prototype.getContext = function(
				this: HTMLCanvasElement, type: string, ...args: unknown[]
			) {
				const gpu = /^(webgl|webgl2|experimental-webgl|webgpu)$/;
				if(gpu.test(type)) return null;
				return Reflect.apply(getContext, this, [type, ...args]);
			} as typeof getContext;
		});
		await page.goto("/");

		const title = page.locator("#resource h3");
		await expect(title).toBeVisible();
		await expect(title).toContainText("WebGL");

		// toBeVisible() doesn't check if the element is covered by others,
		// so we check that the message is actually on top.
		const box = (await title.boundingBox())!;
		const onTop = await page.evaluate(([x, y]) => {
			const element = document.elementFromPoint(x, y);
			return Boolean(element?.closest("#resource"));
		}, [box.x + box.width / 2, box.y + box.height / 2]);
		expect(onTop).toBe(true);
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
				// Simulate network error only on the first attempt.
				route.abort();
			} else {
				retry = true;
				route.continue();
			}
		});
		await page.goto("/");
		const studio = new StudioPage(page);
		await studio.initialized();
		expect(retry).toBeTruthy();
	});
});
