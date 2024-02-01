import { expect, test } from "@playwright/test";

import type { Vertex } from "client/project/components/tree/vertex";
import type * as Studio from "client/main";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

test("Basic UI", async ({ page }) => {
	await expect(page).toHaveTitle(/Box Pleating Studio/);
	await expect(page.locator("nav")).toBeInViewport();
	await expect(page.locator("aside")).toBeAttached();
	await expect(page.locator(".noscript")).not.toBeAttached();
});

test("Project creation", async ({ page }) => {
	await page.locator("#mFile").click();
	await page.locator("#mNew").click();
	const locator = page.locator("nav .tab.active");
	await expect(locator).toBeAttached();
	await expect(locator).toContainText("Untitled");
});

test("Basic vertex dragging", async ({ page }) => {
	await page.locator("#mFile").click();
	await page.locator("#mNew").click();
	await expect(page.locator("nav .tab.active")).toBeAttached();
	await page.mouse.move(514, 282);
	await page.mouse.down();
	const bpHandle = await page.evaluateHandle<typeof Studio>("bp");
	expect(await page.evaluate(([bp]) => (bp.selection.selections[0] as Vertex).$location.x, [bpHandle])).toBe(10);
	await page.mouse.move(601, 282);
	await page.mouse.up();
	expect(await page.evaluate(([bp]) => (bp.selection.selections[0] as Vertex).$location.x, [bpHandle])).toBe(13);
});
