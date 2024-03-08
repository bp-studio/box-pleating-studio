import { expect, test } from "@playwright/test";

import type { Vertex } from "client/project/components/tree/vertex";
import type * as Studio from "client/main";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

test("Basic UI", async ({ page }) => {
	await expect(page).toHaveTitle(/Box Pleating Studio/);
	const menu = page.getByRole("menubar");
	await expect(menu).toBeInViewport();
	await expect(menu.getByRole("menu").first()).not.toBeDisabled();
	await expect(page.getByRole("toolbar")).toBeInViewport();
	await expect(page.getByRole("form")).toBeAttached();
	await expect(page.locator(".noscript")).not.toBeAttached();
});

test("Project creation", async ({ page }) => {
	await page.getByRole("menu", { name: "File" }).click();
	await page.getByRole("menuitem", { name: "New" }).click();
	const locator = page.getByRole("tab");
	await expect(locator).toBeAttached();
	await expect(locator).toContainText("Untitled");
});

test("Basic vertex dragging", async ({ page }) => {
	await page.getByRole("menu", { name: "File" }).click();
	await page.getByRole("menuitem", { name: "New" }).click();
	await expect(page.getByRole("tab")).toBeAttached();
	await page.mouse.move(514, 282);
	await page.mouse.down();
	const bpHandle = await page.evaluateHandle<typeof Studio>("bp");
	expect(await page.evaluate(([bp]) => (bp.selection.selections[0] as Vertex).$location.x, [bpHandle])).toBe(10);
	await page.mouse.move(601, 282);
	await page.mouse.up();
	expect(await page.evaluate(([bp]) => (bp.selection.selections[0] as Vertex).$location.x, [bpHandle])).toBe(13);
});
