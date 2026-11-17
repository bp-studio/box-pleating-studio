import { expect, test } from "@playwright/test";

import { StudioPage } from "../utils/studioPage";

import type { Page } from "@playwright/test";

test.describe("JavaScript disabled", () => {
	test.use({ javaScriptEnabled: false });

	test("Shows JavaScript error message", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator(".noscript")).toBeVisible();
	});
});

/**
 * Simulate a browser in which the GPU is disabled,
 * so that neither WebGPU nor WebGL is available.
 */
async function disableGPU(page: Page): Promise<void> {
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
}

test.describe("GPU disabled", () => {
	test("Shows WebGL error message", async ({ page }) => {
		await disableGPU(page);
		await page.goto("/");

		const resource = page.locator("#resource");
		const title = resource.locator("h3");
		await expect(title).toBeVisible();
		await expect(title).toContainText("WebGL");
		await expect(resource).toContainText("chrome://gpu");
		await expect(resource).toContainText("about:support");
		await expect(resource).toContainText("WebGPU: not supported");

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

test.describe("Localized error messages", () => {
	test.use({ locale: "zh-TW" });

	test("WebGL error", async ({ page }) => {
		await disableGPU(page);
		await page.goto("/");
		await expect(page.locator("#resource h3")).toHaveText("WebGL 初始化失敗");
	});

	test("Resource error after the locale is settled", async ({ page }) => {
		// Pixi is loaded after the locale is settled
		await page.route(/pixi\.\w+\.js/, route => route.abort());
		await page.goto("/");
		const locator = page.locator("#resource");
		await expect(locator.locator("h3")).toHaveText("部分必要的資源無法順利載入。");
		await expect(locator).toContainText("pixi");
	});

	test("Error before the locale is settled", async ({ page }) => {
		await page.addInitScript(() => {
			document.addEventListener("DOMContentLoaded", () => {
				errMgr.setRunErr("Test error");
			});
		});
		await page.goto("/");
		const locator = page.locator("#requirement");
		// The English version is shown first, and then localized.
		await expect(locator.locator("h3")).toHaveText("Box Pleating Studio 啟動時發生錯誤。");
		await expect(locator).toContainText("Test error");
		await expect(locator.getByRole("link", { name: "GitHub" })).toBeVisible();
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
