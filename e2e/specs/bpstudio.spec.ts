import { expect, test } from "@playwright/test";

import { StudioPage } from "../utils";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

test("Basic UI", async ({ page }) => {
	await expect(page).toHaveTitle(/Box Pleating Studio/);
	const menu = page.getByRole("menubar");
	await expect(menu).toBeInViewport();
	await expect(menu.getByRole("menuitem").first()).not.toBeDisabled();
	await expect(page.getByRole("toolbar")).toBeInViewport();
	await expect(page.getByRole("complementary")).toBeAttached(); // <aside>
	await expect(page.getByRole("contentinfo")).toBeAttached(); // <footer>
	await expect(page.locator(".noscript")).not.toBeAttached();
});

test("Project creation", async ({ page }) => {
	await page.getByRole("menuitem", { name: "File" }).click();
	await page.getByRole("menuitem", { name: /New project$/ }).click();
	const locator = page.getByRole("tab");
	await expect(locator).toBeAttached();
	await expect(locator).toContainText("Untitled");
});

test("Basic vertex dragging", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.newProject();
	await studio.mouse.move(10, 7);
	await studio.mouse.down();
	expect(await studio.getX()).toBe(10);
	await studio.mouse.move(13, 7);
	await studio.mouse.up();
	expect(await studio.getX()).toBe(13);
});

test("Basic history", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.newProject();
	await studio.mouse.click(10, 7);
	await page.getByRole("button", { name: "Add leaf" }).click();
	await page.keyboard.press("Control+z");
	await expect(page.getByText("Vertices: 1 / 3")).toBeInViewport();
	await page.keyboard.press("2");
	await expect(page.getByText("Flaps: 2")).toBeInViewport();
});
