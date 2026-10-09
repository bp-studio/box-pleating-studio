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

async function getVertices(page: Page): Promise<Record<number, IPoint>> {
	return await page.evaluate(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const bp = (window as any).bp;
		const result: Record<number, IPoint> = {};
		for(const v of bp.projects.current.value.design.tree.$vertices) {
			result[v.id] = { ...v.$location };
		}
		return result;
	});
}

test("Keeps the relative locations of the pasted vertices", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.newProject();
	await studio.mouse.click(10, 7);
	await page.getByRole("button", { name: "Add leaf" }).click();
	await expect(page.getByText("Vertices: 1 / 4")).toBeInViewport();
	const before = await getVertices(page);

	// Copy vertices 2 and 3, and paste them under vertex 1
	await studio.mouse.click(10, 7);
	await page.keyboard.down("Control");
	await studio.mouse.click(before[3].x, before[3].y);
	await page.keyboard.up("Control");
	await page.keyboard.press("Control+c");
	await studio.mouse.click(10, 13);
	await page.keyboard.press("Control+v");
	await expect(page.getByText("Vertices: 2 / 6")).toBeInViewport();

	const after = await getVertices(page);
	expect(after[5].x - after[4].x).toBe(before[3].x - before[2].x);
	expect(after[5].y - after[4].y).toBe(before[3].y - before[2].y);
	const key = (p: IPoint): string => `${p.x},${p.y}`;
	const old = new Set(Object.values(before).map(key));
	expect(old.has(key(after[4])) || old.has(key(after[5]))).toBe(false);
});

test("Brings the pasted vertices onto the sheet", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.newProject();

	// Vertex 1 is 9 above vertex 0, so pasting it under itself would go
	// beyond the top of the sheet.
	await studio.mouse.move(10, 13);
	await page.mouse.down();
	await studio.mouse.move(10, 19, { steps: 5 });
	await page.mouse.up();
	await page.keyboard.press("Control+c");
	await page.keyboard.press("Control+v");
	await expect(page.getByText("Vertices: 1 / 4")).toBeInViewport();
	expect((await getVertices(page))[3]).toEqual({ x: 10, y: 20 });
});
