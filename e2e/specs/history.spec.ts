import { expect, test } from "@playwright/test";

import { StudioPage } from "../utils/studioPage";
import { GuanYu } from "../sample/sample";

test.beforeEach(({ page }) => page.goto(GuanYu));

test("Dragging session", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.layoutReady();

	expect(await studio.getCanUndo()).toBe(false);
	await studio.mouse.move(43, 43);
	await studio.mouse.down();
	expect(await studio.getTag()).toBe("f19");
	expect(await studio.getX()).toBe(46);

	// Move the mouse in 3 circles around (27,25) with radius 10
	const cx = 27, cy = 25, r = 10, laps = 3, steps = 36;
	for(let i = 0; i <= steps * laps; i++) {
		const angle = (2 * Math.PI * i) / steps;
		// eslint-disable-next-line no-await-in-loop
		await studio.mouse.move(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
	}
	expect(await studio.getX()).toBe(40);
	expect(await studio.getCanUndo()).toBe(true);

	// Undo dragging
	await page.keyboard.press("Control+z");

	// Should restore everything
	expect(await studio.getX()).toBe(46);
	expect(await studio.getCanUndo()).toBe(false);
});
