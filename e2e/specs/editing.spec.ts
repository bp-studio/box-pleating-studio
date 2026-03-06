import { expect, test } from "@playwright/test";

import { StudioPage } from "../utils/studioPage";
import { GuanYu } from "../sample/sample";

test.beforeEach(({ page }) => page.goto(GuanYu));

test("Subdivide grid", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.layoutReady();
	const iptWidth = page.locator("input[type=number]").first();
	await expect(iptWidth).toHaveValue("48");
	await page.getByRole("menuitem", { name: "Edit" }).click();
	await page.getByRole("menuitem", { name: /Subdivide grid$/ }).click();
	await studio.nextTick();
	await expect(iptWidth).toHaveValue("96");
	await studio.mouse.click(79, 49);
	expect(await studio.getTag()).toBe("r16,20");
	await page.keyboard.press("Control+z");
	await studio.nextTick();
	await expect(iptWidth).toHaveValue("48");
});

test("Rotate", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.layoutReady();
	await page.getByRole("menuitem", { name: "Edit" }).click();
	await page.getByRole("menuitem", { name: /Rotate right$/ }).click();
	await studio.update();
	await studio.mouse.click(20, 33);
	expect(await studio.getTag()).toBe("f31");
});

test("Flip", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.layoutReady();
	await page.getByRole("menuitem", { name: "Edit" }).click();
	await page.getByRole("menuitem", { name: /Horizontal flip$/ }).click();
	await studio.update();
	await studio.mouse.click(2, 36);
	expect(await studio.getTag()).toBe("f19");
});
