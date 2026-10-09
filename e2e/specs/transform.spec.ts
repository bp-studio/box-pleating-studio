import { expect, test } from "@playwright/test";

import { StudioPage } from "../utils/studioPage";
import { GuanYu } from "../sample/sample";

import type { Page } from "@playwright/test";
import type { JFlap } from "shared/json";

async function clickMenu(page: Page, name: RegExp): Promise<void> {
	await page.getByRole("menuitem", { name: "Edit" }).click();
	await page.getByRole("menuitem", { name }).click();
}

async function drag(
	studio: StudioPage, from: IPoint, to: IPoint
): Promise<void> {
	await studio.mouse.move(from.x, from.y);
	await studio.page.mouse.down();
	await studio.mouse.move(to.x, to.y, { steps: 5 });
	await studio.page.mouse.up();
}

async function getSelectedFlap(page: Page): Promise<JFlap> {
	return await page.evaluate(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const bp = (window as any).bp;
		return bp.selection.selections[0].toJSON();
	});
}

async function getFlap(page: Page, id: number): Promise<JFlap> {
	return await page.evaluate(i => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const bp = (window as any).bp;
		const flaps = bp.projects.current.value.design.layout.$flaps;
		return [...flaps].find(f => f.id == i).toJSON();
	}, id);
}

test("Rotates the selected vertices about their center", async ({ page }) => {
	await page.goto("/");
	const studio = new StudioPage(page);
	await studio.newProject();

	// Vertices 0, 1, 2 are at (10,10), (10,13), (10,7)
	await page.keyboard.press("Control+a");
	await clickMenu(page, /Rotate right$/);
	await studio.update();
	await studio.mouse.click(13, 10);
	expect(await studio.getTag()).toBe("v1");
	await studio.mouse.click(7, 10);
	expect(await studio.getTag()).toBe("v2");

	// The moves of the vertices and the synced flaps are one step
	await page.keyboard.press("Control+z");
	await studio.update();
	await studio.mouse.click(10, 13);
	expect(await studio.getTag()).toBe("v1");
	expect(await studio.getCanUndo()).toBe(false);
});

test("Rotates both ends of a selected edge", async ({ page }) => {
	await page.goto("/");
	const studio = new StudioPage(page);
	await studio.newProject();

	// The edge 0-1 is from (10,10) to (10,13), and the center (10,11.5) of
	// its ends is rounded to (10,12).
	await studio.mouse.click(10, 11.5);
	expect(await studio.getTag()).toBe("e0,1");
	await clickMenu(page, /Rotate right$/);
	await studio.update();
	await studio.mouse.click(8, 12);
	expect(await studio.getTag()).toBe("v0");
	await studio.mouse.click(11, 12);
	expect(await studio.getTag()).toBe("v1");
});

test("Shifts the selected flaps back into the sheet", async ({ page }) => {
	await page.goto(GuanYu);
	const studio = new StudioPage(page);
	await studio.layoutReady();

	// Flaps 41 and 47 are at (46,21) and (46,27). Rotating them about (46,24)
	// brings flap 47 to (49,24), so both are shifted to the left by 1.
	await studio.mouse.click(46, 21);
	await page.keyboard.down("Control");
	await studio.mouse.click(46, 27);
	await page.keyboard.up("Control");
	await clickMenu(page, /Rotate right$/);
	await studio.update();
	await studio.mouse.click(42, 24);
	expect(await studio.getTag()).toBe("f41");
	expect(await getSelectedFlap(page)).toMatchObject({ x: 42, y: 24 });
	expect(await getFlap(page, 47)).toMatchObject({ x: 48, y: 24 });

	await page.keyboard.press("Control+z");
	await studio.update();
	await studio.mouse.click(46, 21);
	expect(await studio.getTag()).toBe("f41");
});

test("Swaps the width and the height of a rotated flap", async ({ page }) => {
	await page.goto(GuanYu);
	const studio = new StudioPage(page);
	await studio.layoutReady();

	// Flap 8 is 7x10 at (0,27), and its center (3.5,32) is rounded to (4,32)
	await studio.mouse.click(3, 30);
	expect(await studio.getTag()).toBe("f8");
	await clickMenu(page, /Rotate right$/);
	await studio.update();
	const { x, y, width, height } = await getSelectedFlap(page);
	expect({ x, y, width, height })
		.toEqual({ x: 0, y: 29, width: 10, height: 7 });
});

test("Shows a toast if the selection cannot fit", async ({ page }) => {
	await page.goto("/");
	const studio = new StudioPage(page);
	await studio.newProject();
	await drag(studio, { x: 10, y: 13 }, { x: 10, y: 19 });
	await drag(studio, { x: 10, y: 7 }, { x: 10, y: 1 });
	await studio.update();
	await studio.mouse.click(15, 15);
	const iptWidth = page.locator("input[type=number]").first();
	await iptWidth.fill("11");
	await iptWidth.press("Enter");
	await studio.nextTick();

	// The vertices span 18 vertically, but the sheet is only 11 wide
	await studio.mouse.click(5, 15);
	await page.keyboard.press("Control+a");
	await clickMenu(page, /Rotate right$/);
	const toast = page.locator("#divToast");
	await expect(toast).toBeVisible();
	await expect(toast).toContainText("cannot fit");
	await studio.mouse.click(10, 19);
	expect(await studio.getTag()).toBe("v1");
});
