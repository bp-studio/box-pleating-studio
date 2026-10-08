import { expect, test } from "@playwright/test";

import { StudioPage } from "../utils/studioPage";

import type { Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

test("Copy and paste subtrees", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.newProject();

	// Copy leaf 2 and paste it under vertex 0
	await studio.mouse.click(10, 7);
	await page.keyboard.press("Control+c");
	await studio.mouse.click(10, 10);
	await page.keyboard.press("Control+v");
	await expect(page.getByText("Vertices: 1 / 4")).toBeInViewport();

	// Paste again, under the pasted vertex
	await page.keyboard.press("Control+v");
	await expect(page.getByText("Vertices: 1 / 5")).toBeInViewport();

	// Undo
	await page.keyboard.press("Control+z");
	await expect(page.getByText("Vertices: 1 / 4")).toBeInViewport();
});

test("Paste across instances", async ({ page, context }) => {
	const openInstance = async (): Promise<[Page, StudioPage]> => {
		const p = await context.newPage();
		await p.goto("/");
		const s = new StudioPage(p);
		await s.newProject();
		return [p, s];
	};
	const studio = new StudioPage(page);
	await studio.newProject();

	// An instance that is already opened gets notified.
	const [page2, studio2] = await openInstance();
	await studio.mouse.click(10, 7);
	await page.keyboard.press("Control+c");
	await studio2.mouse.click(10, 10);
	await page2.keyboard.press("Control+v");
	await expect(page2.getByText("Vertices: 1 / 4")).toBeInViewport();

	// A new instance asks the others for the content.
	const [page3, studio3] = await openInstance();
	await studio3.mouse.click(10, 10);
	await page3.keyboard.press("Control+v");
	await expect(page3.getByText("Vertices: 1 / 4")).toBeInViewport();
});

test("Cut subtrees", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.newProject();
	await studio.mouse.click(10, 10);
	await page.getByRole("button", { name: "Add leaf" }).click();
	await expect(page.getByText("Vertices: 1 / 4")).toBeInViewport();

	// Cut leaf 2 and paste it back under vertex 0
	await studio.mouse.click(10, 7);
	await page.keyboard.press("Control+x");
	await expect(page.getByText("Vertices: 3")).toBeInViewport();
	await studio.mouse.click(10, 10);
	await page.keyboard.press("Control+v");
	await expect(page.getByText("Vertices: 1 / 4")).toBeInViewport();
});

test("Shows a toast if nothing is copied", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.newProject();
	const toast = page.locator("#divToast");

	// The whole tree is not attached to anything
	await page.keyboard.press("Control+a");
	await page.keyboard.press("Control+c");
	await expect(toast).toContainText("Nothing was copied");
	await expect(page.getByText("Vertices: 3 / 3")).toBeInViewport();

	// Nothing can be deleted from a minimal tree
	await studio.mouse.click(10, 7);
	await page.keyboard.press("Control+x");
	await expect(toast).toContainText("Nothing was copied");
	await expect(page.getByText("Vertices: 1 / 3")).toBeInViewport();
});
