import { expect, test } from "@playwright/test";

import { MockFileSystemFileHandle } from "../utils/mockFileSystemFileHandle";

/** 360 x 640 Resolution, Chrome */
test.describe("Galaxy S5", () => {

	test("Shows 4 recent files", async ({ page }) => {
		await page.goto("/");

		// Setup mock file list
		const mockFiles = Array.from({ length: 10 }, (_, i) => new MockFileSystemFileHandle(`project-${i}.bps`));
		await page.waitForFunction(() => typeof window.idbKeyval !== "undefined");
		await page.evaluate(async handles => {
			await window.idbKeyval.set("recent", handles);
		}, mockFiles);
		await page.reload();

		// Await for the items to be visible (in the CSS sense)
		const quickItems = page.locator(".recent .quick-item:visible");
		await expect(quickItems).toHaveCount(10);

		// Assert that only 4 recent files are not clipped by overflow
		const itemsInViewport = await quickItems.evaluateAll(items =>
			items.filter(item => {
				const rect = item.getBoundingClientRect();
				const parentRect = item.parentElement!.getBoundingClientRect();
				return rect.right <= parentRect.right && rect.left >= parentRect.left;
			})
		);
		expect(itemsInViewport).toHaveLength(4);
	});

});
